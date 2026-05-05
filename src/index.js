{
  "rules";{ 
    "users"; {
      "$uid"; {
        ".read"; "$uid === auth.uid",
        ".write"; "$uid === auth.uid"
      }
    };
    "public_data"; {
      ".read"; true,
      ".write"; false
    }
  }
}

async function saveUserToDB(user, extraData = {}) {
    try {
        await set(ref(db, 'users/' + user.uid), {
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            photo: user.photoURL || null,
            lastLogin: Date.now(),
            ...extraData
        });
    } catch (error) {
        console.error("DB Error:", error);
        throw error;
    }
}

if (isLogin) {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
} else {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    await set(ref(db, 'users/' + user.uid), {
        username: email.split('@')[0],
        email: email,
        lastLogin: Date.now()
    });
}

//  Redirect here
window.location.href = "pollform.html";
export default index.js;