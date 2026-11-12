const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { google } = require("googleapis");

initializeApp();
const db = getFirestore();

// Configure as a secret/environment value in Firebase Functions.
// Never place a Google service-account key in browser code or GitHub.
exports.createDriveAssetFolder = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Faça login.");
  const { companyId, storeId, assetId } = request.data || {};
  if (!companyId || !storeId || !assetId) {
    throw new HttpsError("invalid-argument", "Dados da empresa, loja e ativo são obrigatórios.");
  }

  const userSnap = await db.doc(`users/${request.auth.uid}`).get();
  if (!userSnap.exists || userSnap.data().active !== true) {
    throw new HttpsError("permission-denied", "Usuário inativo ou sem perfil.");
  }
  const memberRef = db.doc(`companies/${companyId}/members/${request.auth.uid}`);
  const memberSnap = await memberRef.get();
  const isSuper = userSnap.data().role === "superadmin";
  if (!isSuper && (!memberSnap.exists || memberSnap.data().active !== true ||
      (memberSnap.data().role !== "company_admin" && !(memberSnap.data().storeIds || []).includes(storeId)))) {
    throw new HttpsError("permission-denied", "Sem acesso a esta loja.");
  }

  // Próxima etapa: conectar a conta/Drive central do Proativo, criar pastas
  // Empresa/Loja/Ativo e salvar o folderId no documento do patrimônio.
  // A credencial deve ser configurada no ambiente seguro do Functions.
  throw new HttpsError("failed-precondition",
    "Integração Google Drive ainda depende da configuração da conta e credencial do projeto.");
});
