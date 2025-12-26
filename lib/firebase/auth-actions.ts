import { auth, db } from "./config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    UserCredential
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
    email: string,
    password: string
): Promise<{ success: boolean; user?: UserCredential; error?: string }> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Save user to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: email.split('@')[0], // Fallback name
            createdAt: serverTimestamp(),
            role: 'user'
        });

        return { success: true, user: userCredential };
    } catch (error: any) {
        let errorMessage = "Error al crear la cuenta";

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo ya está registrado";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña debe tener al menos 6 caracteres";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Correo electrónico inválido";
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Sign in an existing user with email and password
 */
export const loginWithEmail = async (
    email: string,
    password: string
): Promise<{ success: boolean; user?: UserCredential; error?: string }> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential };
    } catch (error: any) {
        let errorMessage = "Error al iniciar sesión";

        if (error.code === 'auth/user-not-found') {
            errorMessage = "No existe una cuenta con este correo";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Contraseña incorrecta";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Correo electrónico inválido";
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = "Esta cuenta ha sido deshabilitada";
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Auto-detect if user should register or login
 * Tries to login first, if user doesn't exist, registers them
 */
export const autoAuthWithEmail = async (
    email: string,
    password: string
): Promise<{ success: boolean; user?: UserCredential; error?: string; action?: 'login' | 'register' }> => {
    // Try login first
    const loginResult = await loginWithEmail(email, password);

    if (loginResult.success) {
        return { ...loginResult, action: 'login' };
    }

    // If user not found, try to register
    if (loginResult.error === "No existe una cuenta con este correo") {
        const registerResult = await registerWithEmail(email, password);
        return { ...registerResult, action: 'register' };
    }

    // Other errors (wrong password, etc.)
    return loginResult;
};
