# Software Studio 2025 Spring
## Midterm Project Chatroom

### Scoring

| **Basic components**    | **Score** | **Check** |
|:----------------------- |:---------:|:---------:|
| Membership Mechanism    |    5%     |     Y     |
| Host your Firebase page |    5%     |     Y     |
| Database read/write     |    15%    |     Y     |
| RWD                     |    55%    |     Y     |
| Git                     |    5%     |     Y     |
| Chatroom                |    20%    |     Y     |

| **Advanced components**                              | **Score** | **Check** |
|:---------------------------------------------------- |:---------:|:---------:|
| Using React                                          |    10%    |     Y     |
| Sign Up/In with Google or other third-party accounts |    5%     |     Y     |
| Use CSS animation                                    |    2%     |     Y     |
| Deal with problems when sending code                 |    2%     |     Y     |

| **Bonus Components**    | **Score** | **Check** |
|:----------------------- |:---------:|:---------:|
| User profile            |    1%     |     Y     |
| Profile picture         |    1%     |     Y     |
| Send image              |    1%     |     Y     |
| Send Video              |    1%     |     Y     |
| Chatbot                 |    2%     |     N     |
| Block User              |    2%     |     N     |
| Unsend message          |    3%     |     Y     |
| Search for message      |    3%     |     Y     |
| Send gif from Tenor API |    3%     |     Y     |

---

### How to use 

#### 1. Prerequisites
- [Node.js](https://nodejs.org/) v14 or higher  
- [npm](https://www.npmjs.com/) (comes with Node)  
- A Firebase project (we use Authentication, Firestore & Storage)  

#### 2. Clone & Install

If using github: 

```bash
git clone https://github.com/angelineaurelia/chatroom-application
cd chatroom-application
npm install
```

#### 3. Firebase configuration

1. Create a file called `.env.local` in the project root (this is git-ignored) and paste in the Firebase config like so:

    ```text
    Check the README.md from FileZilla to prevent google API in public repo!
    ```
    
2. Ensure your **Firestore**, **Storage** and **Hosting** rules are in place:
    
    ```bash
    # to test locally
    firebase emulators:start
    ```
    
#### 4. Run locally

```bash
npm start
```

- App will open at `http://localhost:3000` by default
- Sign up / log in and you’re good to go!

### Function description
- **Email/password & Google sign-in**
- **Responsive design**: works seamlessly on desktop and mobile screens
- **Private group chatrooms**: name your room, invite any number of registered users
- **Message history**: load all history message of current chatroom with date separators
- **Browser notifications** for incoming messages when the tab isn’t focused (make sure to allow notification)
- **CSS animations**: animations for when searching text highlight, opening modal, and text bubble.

- **User profiles**: editable profile picture, name, email, phone & address
- **Media support**: send images, videos or GIFs (via Tenor API)
- **Unsend messages**: authors can delete their own messages
- **Search messages**: click the 🔍 icon in the chat header, type to jump & highlight
- **Search chatrooms**: filter by room name in real time

### How to use
1. **Sign up** or **log in** (email/password or Google).
2. Once inside, you’ll see your **chatroom list** on the left.
3. Click **“New Message +”** to create a room:
    - Give it a name
    - Select one or more users to invite (you’re added automatically)
    - If no other users are invited, it will be a private room just for you
4. Select a room to open its **message view**.
    - Type a message and hit **Send**
    - Or click the **＋** to **attach** an image/video or pick a GIF
    - Click the “Unsend” button to delete previously deleted message
5. Click your **profile avatar** (top-left) to edit your own profile.

### Operating the App
**Navigation**
- **Sidebar** (desktop) or **drawer** (mobile): shows your rooms + search bar
- **Chat area**: header shows room name + members; messages flow below; input at bottom
- **Profile & Logout** buttons are at the top of the sidebar

**Mobile view**
Mobile view for this app is supported
- After logging in, user is able to create a new chatroom or open existing chatroom
- Open existing one by clicking on the desired chatroom in the list
- The rest should work similarly

### Web page link

    https://wapp-chattr.web.app

### Github Link

    https://github.com/angelineaurelia/chatroom-application

### Others

Check demo.mov for a quick preview of the app. 
Demo using Macbook Apple Sillicon
Browser: Arc (Chromium-based)

<style>
table th{
    width: 100%;
}
</style>
