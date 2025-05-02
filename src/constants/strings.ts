// src/constants/strings.ts

// --- Hierarchy ---
// Define base levels with internal keys and default display names
export const HIERARCHIA_BASE_LEVELS = [
    { key: 'projetuno', defaultName: 'Projetuno' },
    { key: 'caloiro', defaultName: 'Caloiro' },
    { key: 'tuno', defaultName: 'Tuno' },
    { key: 'veterano', defaultName: 'Veterano' },
    { key: 'cota_tuno', defaultName: 'Cota-Tuno' },
    { key: 'cota_veterano', defaultName: 'Cota-Veterano' },
    { key: 'antigo_elemento', defaultName: 'Antigo Elemento' },
] as const; // Use 'as const' for stricter typing

// --- Dropdown Actions ---
export const ADD_NEW_OPTION_VALUE = "__add_new__";
export const ADD_NEW_OPTION_TEXT = "+ Add New...";
export const REMOVE_OPTION_INFO = "To remove an option, please edit all members currently assigned that value.";

// --- Validation & Warning Messages ---
// Hierarchy
export const ERROR_REQUIRES_SUBIDA_DATE = "Cannot assign this hierarchy level without setting 'Subida a Palco' date first.";
export const ERROR_PROJETUNO_WITH_SUBIDA_DATE = "Cannot set hierarchy to 'Projetuno' when 'Subida a Palco' date is already set.";
export const CONFIRM_CALOIRO_NO_SUBIDA = "Are you sure? Saving as 'Caloiro' without a 'Subida a Palco' date is unusual.";
export const CONFIRM_TUNO_NO_PASSAGEM = "Are you sure? Saving as 'Tuno' without a 'Passagem a Tuno' date is unusual.";
export const WARNING_TUNO_OVER_2_YEARS = "More than 2 years since 'Passagem a Tuno'. Hierarchy should likely be 'Veterano', 'Cota-Veterano', or 'Cota-Tuno'.";
export const PROMPT_TUNO_UPGRADE_TITLE = "Hierarchy Review Needed";
export const PROMPT_TUNO_UPGRADE_MESSAGE = (name: string) => `${name} has been 'Tuno' for over 2 years. Consider updating their hierarchy to 'Veterano' or 'Cota-Tuno'.`;
export const PROMPT_TUNO_UPGRADE_BUTTON = "Edit Person";

// Forms & General
export const ERROR_NAME_GENDER_REQUIRED = "Name and Gender are required fields.";
export const PROMPT_ADD_NEW_NAIPE = "Enter the new Naipe Vocal:";
export const PROMPT_ADD_NEW_INSTRUMENT = "Enter the new Instrument name:";
export const PROMPT_ADD_NEW_HIERARCHY = "Enter the name for the new Hierarchy level:";
export const ERROR_INVALID_DATE_FORMAT = "Invalid date format. Please use YYYY-MM-DD.";

// Import/Save
export const CONFIRM_IMPORT_OVERWRITE_TITLE = "Confirm Import & Overwrite";
export const CONFIRM_IMPORT_OVERWRITE_MSG = "Importing this file will overwrite the current tree data in the shared database. This action is irreversible. Are you sure you want to continue?";
export const CONFIRM_IMPORT_LOCAL_NOTE = "(Note: You are not logged in. This import will only affect your local view unless you log in and save.)";
export const IMPORT_SUCCESS_PARTIAL = (errors: string[]) => `Import successful with minor issues:\n- ${errors.join('\n- ')}\nCheck console for details.`;
export const IMPORT_FAILED_INVALID = (errors: string[]) => `Import failed due to invalid data format:\n- ${errors.join('\n- ')}\nPlease check the file structure or console for details.`;
export const IMPORT_ZIP_UNSUPPORTED = "ZIP file import is not supported when using external image URLs. Please import the JSON file directly.";
export const IMPORT_LOCAL_WARNING = "Data imported locally. Log in to save to the shared tree.";
export const SAVE_SUCCESS = "Tree data saved successfully.";
export const SAVE_FAILED_PERMISSION = "Error saving data: Permission denied. You might need to log in again or check permissions.";
export const SAVE_FAILED_INVALID_DATA = (errors: string[]) => `Cannot save: Invalid data format detected.\n- ${errors.join('\n- ')}`;
export const SAVE_FAILED_GENERAL = (message: string) => `Error saving data: ${message}`;
export const SAVE_UNAVAILABLE = "Error: Cannot save data. Please ensure you are logged in and Firebase is connected.";

// Deletion
export const CONFIRM_DELETE_TITLE = "Confirm Deletion";
export const CONFIRM_DELETE_MSG = (name: string) => `Are you sure you want to delete ${name}? This action is irreversible and will remove them from the tree.`;

// Login/Auth
export const LOGIN_UNAVAILABLE = "Login unavailable: Firebase is not configured correctly.";
export const SIGNUP_UNAVAILABLE = "Sign up unavailable: Firebase is not configured correctly.";
export const LOGOUT_FAILED = (message: string) => `Logout failed: ${message}`;
export const AUTH_SERVICE_UNAVAILABLE = "Authentication service unavailable.";
export const VERIFICATION_WARNING = "Your email is not verified. Please check your inbox (and spam folder) for the verification link. Some features might be limited.";
export const VERIFICATION_RESEND_PROMPT = "(Resend verification email)";
export const VERIFICATION_RESEND_WAIT = "(Wait 10s)";
export const VERIFICATION_SENDING = "Sending verification email...";
export const VERIFICATION_SENT = "New verification email sent! Check your inbox/spam.";
export const VERIFICATION_FAILED = (message: string) => `Failed to send email: ${message}`;

// Config/Firebase
export const FIREBASE_CONFIG_ERROR = "Firebase configuration invalid or connection failed. Showing demo data. Export/Import still available locally.";
export const FIREBASE_DB_UNAVAILABLE = "Error: Firebase Database service not initialized correctly.";
export const FIREBASE_FETCH_ERROR = (message: string) => `Error fetching data: ${message}. Displaying demo data.`;
export const FIREBASE_FETCH_PERMISSION_ERROR = "Error fetching data: Permission denied. Check database rules. Displaying demo data.";
export const FIREBASE_DATA_ERROR = (errors: string) => `Data error in Firebase: ${errors}. Displaying demo data.`;
export const FIREBASE_DATA_EMPTY_ARRAY = "Firebase connection successful. No tree members found yet. Displaying demo.";
export const FIREBASE_DATA_EMPTY_NODE = "Firebase connection successful, but no tree data found. Displaying demo data.";