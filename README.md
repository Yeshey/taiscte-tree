# TAISCTE_tree
Árvore geneologica da tuna TAISCTE Lisboa!

See the site here: https://yeshey.github.io/taiscte-tree/

## Get started in development:

1. Install `nodejs`, or do `direnv allow` if you have nix installed.
2. Run `npm install` to install all needed dependencies for the project.
3. `npm start` to run the project locally and make changes in real time. 
4. `npm run deploy`, deploys the site, the URL is defined in `"homepage"` of `package.json`, the site now is `https://Yeshey.github.io/taiscte-tree`  
   - This uses the `gh-pages` package that deploys a static version of the site to the branch `gh-pages`, witch is where GitHub looks for `index.html` witch will be the static version of our site. 
5. Create or ask for the `.env` file with the access keys to the database. The file should look like:
   ```env
   REACT_APP_FIREBASE_API_KEY="AIzaSyD***************N7s"
   REACT_APP_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   REACT_APP_FIREBASE_PROJECT_ID="your-project-id"
   REACT_APP_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   REACT_APP_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
   REACT_APP_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
   REACT_APP_FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.region.firebasedatabase.app"
   ```
   If you want to create a new or your own firebase database to connect to this project [follow this](#creating-a-new-firebase-project-2025)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

> This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Creating a New Firebase Project (2025)


### 1. Create a Firebase Project  
1. Go to the Firebase console at https://console.firebase.google.com and click **Add project**  ([Add Firebase to your JavaScript project | Firebase for web platforms](https://firebase.google.com/docs/web/setup?utm_source=chatgpt.com)).  
2. Enter your project name (e.g. `my-app`), optionally enable Google Analytics, then click **Create project** and wait for Firebase to provision resources  ([Add Firebase to your JavaScript project | Firebase for web platforms](https://firebase.google.com/docs/web/setup?utm_source=chatgpt.com)).  

---

### 2. Register a Web App & Obtain Your Config  
1. In your new project’s **Overview** page, click the **Web (</>)** icon to start the “Add Firebase to your web app” workflow  ([Add Firebase to your JavaScript project | Firebase for web platforms](https://firebase.google.com/docs/web/setup?utm_source=chatgpt.com)).  
2. Give your app a nickname (internal only) and click **Register app**  ([Add Firebase to your JavaScript project | Firebase for web platforms](https://firebase.google.com/docs/web/setup?utm_source=chatgpt.com)).  
3. Firebase will display a JavaScript snippet with your **firebaseConfig** object—copy this entire object; it looks like:  
   ```js
   const firebaseConfig = {
     apiKey: "…",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "…",
     appId: "…",
     measurementId: "…" // optional
   };
   ```  
   Each of those keys (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) is required to initialize Firebase in your app  ([Get Started with Firebase Authentication on Websites](https://firebase.google.com/docs/auth/web/start?utm_source=chatgpt.com), [Add Firebase to your JavaScript project | Firebase for web platforms](https://firebase.google.com/docs/web/setup?utm_source=chatgpt.com)).  

---

### 3. Enable Firebase Authentication  
1. In the console sidebar, under **Build → Authentication**, click **Get started**  ([Step-by-step guide on how to set up Firebase for a web application.](https://www.linkedin.com/pulse/step-by-step-guide-how-set-up-firebase-web-maryam-fatima-rajput-aufxf?utm_source=chatgpt.com)).  
2. In the **Sign-in methods** tab, enable whichever providers you need (e.g. Email/Password, Google, Facebook) and follow the prompts to configure each  ([Step-by-step guide on how to set up Firebase for a web application.](https://www.linkedin.com/pulse/step-by-step-guide-how-set-up-firebase-web-maryam-fatima-rajput-aufxf?utm_source=chatgpt.com)).  
3. Still in **Authentication → Settings**, under **Authorized domains**, add every domain or localhost origin your app will use—otherwise OAuth redirects will be blocked  ([Add Firebase to your web service - Google Cloud](https://cloud.google.com/appengine/docs/standard/python3/building-app/adding-firebase?utm_source=chatgpt.com)).  

---

### 4. (Optional) Set Up Your Database  
- **Realtime Database**: go to **Build → Realtime Database**, click **Create database**, choose your location/region, and pick a test / locked-down ruleset  ([Step-by-step guide on how to set up Firebase for a web application.](https://www.linkedin.com/pulse/step-by-step-guide-how-set-up-firebase-web-maryam-fatima-rajput-aufxf?utm_source=chatgpt.com)).  
- **Cloud Firestore**: go to **Build → Firestore**, click **Create database**, choose “production” or “test” mode and select a region  ([Step-by-step guide on how to set up Firebase for a web application.](https://www.linkedin.com/pulse/step-by-step-guide-how-set-up-firebase-web-maryam-fatima-rajput-aufxf?utm_source=chatgpt.com)).  
- If you use Realtime Database, note its URL (e.g. `https://YOUR_PROJECT_ID.firebaseio.com`); for Firestore the `projectId` in your config is sufficient.  