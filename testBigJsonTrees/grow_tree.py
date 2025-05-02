# run with fore example
# python grow_tree.py tuna-tree-big.json tuna-tree-small-massive.json -n 15
# -n 15 is the number of iterations to copy the original tree. This script grabs a tree and duplicates it n times.

import json
import uuid
import argparse
import copy
import random
import sys

# Increase recursion depth limit for deep copies of potentially large structures
# Be cautious with this, as it can lead to stack overflows if abused
# sys.setrecursionlimit(2000) # Adjust if needed, start without it first

def randomize_ids_and_map(data):
    """
    Deep copies the input data, replaces 'id' and 'parentId' fields
    with new random UUIDs, maintaining internal relationships within the copy.

    Args:
        data (list): A list of dictionaries (the tree structure to copy and randomize).

    Returns:
        tuple: (list, dict):
            - A new list of dictionaries (the randomized copy).
            - A mapping dictionary from old IDs (in the input data) to
              new UUIDs (in the returned list).
    """
    if not isinstance(data, list):
        raise TypeError("Input data must be a list of objects.")

    id_map = {}
    new_data = []
    original_ids = set(item.get('id') for item in data if isinstance(item, dict) and 'id' in item)

    # --- Create a map of old IDs to new UUIDs for items in THIS data block ---
    # Use deepcopy here to ensure we are working with a completely independent copy
    copied_data = copy.deepcopy(data)

    for item in copied_data:
        if not isinstance(item, dict):
            continue
        if 'id' in item:
            old_id = item['id']
            # Generate a new UUID for every original ID in this copied block
            new_uuid = str(uuid.uuid4())
            id_map[old_id] = new_uuid
            item['id'] = new_uuid # Update the ID in the copy immediately

    # --- Update parentIds within the copied block ---
    for item in copied_data:
         if not isinstance(item, dict):
             new_data.append(item) # Add non-dict items as is
             continue

         # Replace 'parentId' if it exists and the old parentId is in our map
         if 'parentId' in item and item['parentId'] in id_map:
             item['parentId'] = id_map[item['parentId']]
         elif 'parentId' in item and item['parentId'] not in original_ids:
             # If parentId existed but doesn't map to an ID within this block,
             # it might be a root node intended for linking later or an orphan.
             # Keep it as is for now, it will be updated if it's a root.
             # Or, if we want to strictly clear parentIds that don't resolve *within* the block:
             # print(f"Warning: parentId '{item['parentId']}' in copied block does not map to a known ID within the block. Clearing parentId.")
             # del item['parentId'] # Option: remove parentId if it's external to the copied block
             pass # Keep it for now, root nodes will be handled later


         new_data.append(item)

    return new_data, id_map

def find_leaf_node_ids(current_tree_data):
    """
    Finds the IDs of all leaf nodes in the current tree structure.
    A leaf node is one whose 'id' does not appear as a 'parentId' in any other node.
    """
    all_ids = set()
    parent_ids = set()

    for item in current_tree_data:
        if isinstance(item, dict):
            if 'id' in item:
                all_ids.add(item['id'])
            if 'parentId' in item:
                parent_ids.add(item['parentId'])

    leaf_ids = all_ids - parent_ids
    # Handle case where the tree might be empty or have no valid nodes
    if not leaf_ids and all_ids:
        # If there are nodes but no leaves (e.g., a circular structure, or only one node)
        # return all existing IDs as potential attachment points.
         print("Warning: No clear leaf nodes found (potential cycle or single node?). Using all available nodes as potential parents.")
         return list(all_ids)
    return list(leaf_ids)

def main():
    parser = argparse.ArgumentParser(description="Recursively duplicate and attach a JSON tree structure.")
    parser.add_argument("input_file", help="Path to the initial JSON tree file.")
    parser.add_argument("output_file", help="Path to the output JSON file.")
    parser.add_argument("-n", "--iterations", type=int, default=1000, help="Number of duplication iterations (default: 1000).")

    args = parser.parse_args()

    if args.iterations <= 0:
        print("Error: Number of iterations must be positive.")
        return

    try:
        print(f"Reading initial tree structure from {args.input_file}...")
        with open(args.input_file, 'r', encoding='utf-8') as f_in:
            # Load the original structure ONCE
            original_tree_structure = json.load(f_in)
            if not isinstance(original_tree_structure, list):
                print(f"Error: Input JSON must be a list of objects. Found: {type(original_tree_structure)}")
                return
            # Keep a pristine copy for duplication
            base_template_tree = copy.deepcopy(original_tree_structure)
            print(f"Initial tree loaded with {len(original_tree_structure)} nodes.")

    except FileNotFoundError:
        print(f"Error: Input file not found: {args.input_file}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {args.input_file}")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading the file: {e}")
        return

    # --- Identify original root nodes (nodes without parentId IN THE TEMPLATE) ---
    original_root_node_old_ids = set()
    original_ids_in_template = set()
    for node in base_template_tree:
        if isinstance(node, dict):
            if 'id' in node:
                original_ids_in_template.add(node['id'])

    for node in base_template_tree:
         if isinstance(node, dict):
            # A root node is one without a parentId OR whose parentId isn't in the template's ID set
            if 'id' in node and ('parentId' not in node or node.get('parentId') not in original_ids_in_template):
                 original_root_node_old_ids.add(node['id'])

    if not original_root_node_old_ids:
        print("Warning: Could not identify any root nodes in the original template. Attachment might not work as expected.")


    # --- Iteration Loop ---
    current_tree_data = original_tree_structure # Start with the loaded data
    num_iterations = args.iterations

    print(f"Starting {num_iterations} duplication iterations...")
    for i in range(num_iterations):
        # 1. Find leaf nodes in the CURRENT tree
        leaf_ids = find_leaf_node_ids(current_tree_data)

        if not leaf_ids:
            print(f"Error: No leaf nodes found in iteration {i+1}. Cannot attach new tree. Stopping.")
            # Optionally save the current state or just exit
            break # Stop the loop if no attachment point is available

        # 2. Choose a random leaf node ID from the current tree
        parent_leaf_id = random.choice(leaf_ids)

        # 3. Duplicate the ORIGINAL template and randomize its IDs
        #    Use the pristine base_template_tree for copying
        new_duplicate_tree, old_to_new_id_map = randomize_ids_and_map(base_template_tree)

        # 4. Attach the new duplicate's root nodes to the chosen leaf
        nodes_to_append = []
        attached_count = 0
        for node in new_duplicate_tree:
            if not isinstance(node, dict):
                nodes_to_append.append(node) # Keep non-dict items if any
                continue

            # Find the original ID corresponding to this node's new ID
            original_id = None
            for old, new in old_to_new_id_map.items():
                if new == node.get('id'):
                    original_id = old
                    break

            # Check if this node *was* one of the original root nodes
            if original_id in original_root_node_old_ids:
                node['parentId'] = parent_leaf_id # Attach to the chosen leaf
                attached_count += 1

            nodes_to_append.append(node)

        # 5. Combine the current tree with the newly attached duplicate
        current_tree_data.extend(nodes_to_append)

        print(f"Iteration {i+1}/{num_iterations} completed. Attached {attached_count} root(s) of new duplicate "
              f"(size: {len(nodes_to_append)}) to leaf node {parent_leaf_id}. "
              f"Total nodes: {len(current_tree_data)}")

        # --- Memory Usage Check (Optional but Recommended) ---
        # import os, psutil
        # process = psutil.Process(os.getpid())
        # mem_mb = process.memory_info().rss / (1024 * 1024)
        # print(f"    Memory usage: {mem_mb:.2f} MB")
        # if mem_mb > 4096: # Example threshold: 4GB
        #    print("Warning: Memory usage exceeding threshold. Consider reducing iterations.")


    # --- Save the final result ---
    try:
        print(f"\nWriting final tree with {len(current_tree_data)} nodes to {args.output_file}...")
        with open(args.output_file, 'w', encoding='utf-8') as f_out:
            # Use compact separators for potentially huge files
            json.dump(current_tree_data, f_out, ensure_ascii=False, separators=(',', ':'))
            # Or use indent=2 for smaller test runs for readability:
            # json.dump(current_tree_data, f_out, indent=2, ensure_ascii=False)
        print("Done.")
    except IOError as e:
        print(f"Error: Could not write to output file: {args.output_file}. {e}")
    except Exception as e:
        print(f"An unexpected error occurred while writing the file: {e}")

if __name__ == "__main__":
    main()