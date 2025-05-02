// src/constants/strings.ts
// --- START OF FILE src/constants/strings.ts ---
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
export const ERROR_NAME_GENDER_FAMILYNAME_REQUIRED = "Name, Gender, and Family Name are required fields."; // Updated error message
export const PROMPT_ADD_NEW_FAMILY_NAME = "Enter the new Family Name:"; // Added prompt
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
export const IMPORT_LOCAL_VERIFY_WARNING = "Data imported locally. Verify your email to save to the shared tree."; // New
export const SAVE_SUCCESS = "Tree data saved successfully.";
export const SAVE_FAILED_PERMISSION = "Error saving data: Permission denied. Check database rules or login status."; // Updated
export const SAVE_FAILED_PERMISSION_VERIFY = "Error saving data: Your email must be verified to save changes."; // New
export const SAVE_FAILED_INVALID_DATA = (errors: string[]) => `Cannot save: Invalid data format detected.\n- ${errors.join('\n- ')}`;
export const SAVE_FAILED_GENERAL = (message: string) => `Error saving data: ${message}`;
export const SAVE_UNAVAILABLE = "Error: Cannot save data. Please ensure you are logged in, verified, and Firebase is connected."; // Updated

// Deletion
export const CONFIRM_DELETE_TITLE = "Confirm Deletion";
export const CONFIRM_DELETE_MSG = (name: string) => `Are you sure you want to delete ${name}? This action is irreversible and will remove them from the tree.`;
export const ACTION_REQUIRES_VERIFICATION = (action: string) => `Cannot ${action}: Your email must be verified.`; // New

// Login/Auth/Signup
export const LOGIN_UNAVAILABLE = "Login unavailable: Firebase is not configured correctly.";
export const SIGNUP_UNAVAILABLE = "Sign up unavailable: Firebase is not configured correctly.";
export const SIGNUP_REQUIRES_INVITE = "Account creation requires a valid invite link."; // New
export const LOGOUT_FAILED = (message: string) => `Logout failed: ${message}`;
export const AUTH_SERVICE_UNAVAILABLE = "Authentication service unavailable.";
export const VERIFICATION_WARNING = "Your email is not verified. Please check your inbox (and spam folder) for the verification link. Some features might be limited.";
export const VERIFICATION_RESEND_PROMPT = "(Resend verification email)";
export const VERIFICATION_RESEND_WAIT = "(Wait 10s)";
export const VERIFICATION_SENDING = "Sending verification email...";
export const VERIFICATION_SENT = "New verification email sent! Check your inbox/spam.";
export const VERIFICATION_FAILED = (message: string) => `Failed to send email: ${message}`;

// Password Reset
export const FORGOT_PASSWORD_PROMPT = "Forgot Password?"; // New
export const PASSWORD_RESET_EMAIL_LABEL = "Enter your account email:"; // New
export const PASSWORD_RESET_BUTTON_TEXT = "Send Reset Link"; // New
export const PASSWORD_RESET_SENDING = "Sending..."; // New
export const PASSWORD_RESET_SUCCESS = (email: string) => `Password reset email sent to ${email}. Check your inbox (and spam folder).`; // New
export const PASSWORD_RESET_FAILED = (message: string) => `Password reset failed: ${message}`; // New
export const PASSWORD_RESET_ERROR_NO_EMAIL = "Please enter the email address associated with your account."; // New

// Invite System
export const INVITE_GENERATE_BUTTON = "Generate Invite Link"; // New
export const INVITE_GENERATE_LOADING = "Generating..."; // New
export const INVITE_GENERATE_SUCCESS_TITLE = "Invite Link Generated"; // New
export const INVITE_GENERATE_SUCCESS_MSG = "Share this link with the person you want to invite. It can only be used once."; // New
export const INVITE_COPY_BUTTON = "Copy Link"; // New
export const INVITE_COPIED_MSG = "Link copied to clipboard!"; // New
export const INVITE_CLOSE_BUTTON = "Close"; // New
export const INVITE_GENERATE_ERROR_PERMISSIONS = "You must be logged in and verified to generate invites."; // New
export const INVITE_GENERATE_ERROR_DB = (message: string) => `Failed to create invite: ${message}`; // New
export const INVITE_CHECKING = "Checking invite validity..."; // New
export const INVITE_ERROR_USED = "This invite link has already been used."; // New
export const INVITE_ERROR_NOT_FOUND = "Invalid or expired invite link."; // New
export const INVITE_ERROR_CHECK_FAILED = (message: string) => `Failed to check invite: ${message}`; // New
export const INVITE_ERROR_FIREBASE_UNAVAILABLE = "Cannot validate invite: Firebase connection error."; // New
export const SIGNUP_INVALID_INVITE = "Cannot sign up: Invalid or used invite link."; // New

// Config/Firebase
export const FIREBASE_CONFIG_ERROR = "Firebase configuration invalid or connection failed. Some features (like saving/login) are disabled."; // Updated
export const FIREBASE_DB_UNAVAILABLE = "Error: Firebase Database service not initialized correctly.";
export const FIREBASE_FETCH_ERROR = (message: string) => `Error fetching data: ${message}.`; // Simplified
export const FIREBASE_FETCH_PERMISSION_ERROR = "Error fetching data: Permission denied. Check database rules."; // Simplified
export const FIREBASE_DATA_ERROR = (errors: string) => `Data error in Firebase: ${errors}. Check console.`; // Simplified
export const FIREBASE_DATA_EMPTY_ARRAY = "No tree members found in the database."; // Simplified
export const FIREBASE_DATA_EMPTY_NODE = "No tree data found in the database."; // Simplified
// --- END OF FILE src/constants/strings.ts ---