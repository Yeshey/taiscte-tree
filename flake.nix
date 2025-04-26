{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { systems, nixpkgs, ... } @ inputs:
  let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (
        system:
          f nixpkgs.legacyPackages.${system}
      );
  in {
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_23
          # pkgs.nodePackages.npm
          pkgs.git
        ];

        shellHook = ''
          echo "React GitHub Pages Development Environment Ready!"
          echo ""
          echo "To create a new React app:"
          echo "  npx create-react-app my-app"
          echo ""
          echo "To enter the project directory:"
          echo "  cd my-app"
          echo ""
          echo "To install gh-pages package:"
          echo "  npm install gh-pages --save-dev"
          echo ""
          echo "To deploy to GitHub Pages:"
          echo "  npm run deploy"
          echo ""
          echo "Don't forget to set up your package.json with:"
          echo "  - homepage property"
          echo "  - predeploy and deploy scripts"
          echo ""
          echo "Refer to the tutorial for complete instructions."
        '';
      };
    });
  };
}