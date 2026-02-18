import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, documentId } from "firebase/firestore";
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
      if (userProfile.role !== 'superadmin') throw new Error("Unauthorized");
      
      const newOrg = {
        name,
        slug,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "organizations"), newOrg);
      const createdOrg = { id: docRef.id, ...newOrg };
      setOrganizations([...organizations, createdOrg]);
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
