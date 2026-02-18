import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, documentId, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

function getOrgIds(userProfile) {
  if (userProfile.organizations && typeof userProfile.organizations === "object") {
    return Object.keys(userProfile.organizations);
  }
  return userProfile.organizationIds || [];
}

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
        let orgIds = [];
        if (userProfile.role === "superadmin") {
          const q = query(collection(db, "organizations"));
          const snapshot = await getDocs(q);
          const orgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setOrganizations(orgs);
          if (orgs.length > 0 && !currentOrg) setCurrentOrg(orgs[0]);
          setLoading(false);
          return;
        }

        orgIds = getOrgIds(userProfile);
        if (orgIds.length === 0) {
          setOrganizations([]);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "organizations"),
          where(documentId(), "in", orgIds.slice(0, 10))
        );
        const snapshot = await getDocs(q);
        let orgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (orgIds.length > 10) {
          const rest = orgIds.slice(10);
          const q2 = query(
            collection(db, "organizations"),
            where(documentId(), "in", rest)
          );
          const snapshot2 = await getDocs(q2);
          orgs = [...orgs, ...snapshot2.docs.map((d) => ({ id: d.id, ...d.data() }))];
        }
        setOrganizations(orgs);
        if (orgs.length > 0 && !currentOrg) setCurrentOrg(orgs[0]);
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
    const canCreate =
      userProfile.role === "superadmin" ||
      userProfile.role === "admin" ||
      userProfile.hasOrgAdminRole;
    if (!canCreate) throw new Error("Unauthorized");

    const newOrg = {
      name,
      slug,
      createdBy: userProfile.uid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "organizations"), newOrg);
    const createdOrg = { id: docRef.id, ...newOrg };

    if (userProfile.role !== "superadmin") {
      const userRef = doc(db, "users", userProfile.uid);
      const existingOrgs = userProfile.organizations || {};
      await updateDoc(userRef, {
        organizations: { ...existingOrgs, [docRef.id]: "admin" },
        hasOrgAdminRole: true,
      });
    }

    setCurrentOrg(createdOrg);
    return createdOrg;
  };

  const isOrgAdmin = (orgId) => {
    if (!userProfile) return false;
    if (userProfile.role === "superadmin") return true;
    if (userProfile.organizations?.[orgId] === "admin") return true;
    if (userProfile.organizationIds?.includes(orgId) && userProfile.role === "admin") return true;
    return false;
  };

  return {
    organizations,
    currentOrg,
    setCurrentOrg,
    loading,
    error,
    createOrganization,
    isOrgAdmin,
  };
}
