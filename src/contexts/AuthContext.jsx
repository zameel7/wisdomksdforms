import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

async function processPendingInvitations(user) {
  if (!user?.email) return;
  const invitationsQuery = query(
    collection(db, "orgMembers"),
    where("email", "==", user.email),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(invitationsQuery);
  if (snapshot.empty) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const existingOrgs = userSnap.exists() ? (userSnap.data().organizations || {}) : {};

  const updates = {};
  for (const invDoc of snapshot.docs) {
    const { orgId, role } = invDoc.data();
    updates[orgId] = role;
    await updateDoc(doc(db, "orgMembers", invDoc.id), {
      userId: user.uid,
      status: "active",
    });
  }

  const newOrgs = { ...existingOrgs, ...updates };
  const hasOrgAdminRole = Object.values(newOrgs).includes("admin");
  await updateDoc(userRef, {
    organizations: newOrgs,
    ...(hasOrgAdminRole && { hasOrgAdminRole: true }),
  });
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          organizations: {},
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        await processPendingInvitations(user);
        const updatedSnap = await getDoc(userRef);
        setUserProfile(updatedSnap.exists() ? updatedSnap.data() : newProfile);
      } else {
        await processPendingInvitations(user);
        const updatedSnap = await getDoc(userRef);
        setUserProfile(updatedSnap.data());
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        processPendingInvitations(user).catch(console.error);
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
