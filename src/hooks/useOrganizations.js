import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, documentId, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useOrganizations() {
  const { userProfile } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrgs() {
      if (!userProfile) return;
      setLoading(true);
      setError(null);
      try {
        let q;
        if (userProfile.role === 'superadmin') {
          // Superadmin sees all organizations
          q = query(collection(db, "organizations"));
        } else if (userProfile.organizationIds && userProfile.organizationIds.length > 0) {
          // Admin sees only their assigned organizations
          q = query(collection(db, "organizations"), where(documentId(), "in", userProfile.organizationIds));
        } else {
          // No organizations assigned
          setOrganizations([]);
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(q);
        const orgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrganizations(orgs);
        
        // Auto-select first org if none selected
        if (orgs.length > 0 && !currentOrg) {
          setCurrentOrg(orgs[0]);
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();
  }, [userProfile]);

  const createOrganization = async (name, slug) => {
    try {
      if (userProfile.role !== 'superadmin' && userProfile.role !== 'admin') throw new Error("Unauthorized");
      
      const newOrg = {
        name,
        slug,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "organizations"), newOrg);
      const createdOrg = { id: docRef.id, ...newOrg };

      // If user is admin (not superadmin), add this org to their profile
      if (userProfile.role === 'admin') {
          const userRef = doc(db, "users", userProfile.uid);
          await updateDoc(userRef, {
              organizationIds: arrayUnion(docRef.id)
          });
          // Note: AuthContext onSnapshot will automatically update userProfile, 
          // triggering re-fetch of organizations in useEffect.
      }
      
      // For superadmin, or just immediate feedback, we can update local state, 
      // but useEffect will likely handle it via userProfile update or just re-fetch.
      // However, since superadmin queries all orgs, and admin queries by ID,
      // letting the useEffect handle the list update is safer to avoid duplication.
      // But we can set currentOrg.
      setCurrentOrg(createdOrg);
      return createdOrg;
    } catch (err) {
      console.error("Error creating organization:", err);
      throw err;
    }
  };

  return {
    organizations,
    currentOrg,
    setCurrentOrg,
    loading,
    error,
    createOrganization
  };
}
