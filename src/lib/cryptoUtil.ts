export const enc = new TextEncoder();

export const getPasswordKey = (password: string) =>
	window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
		"deriveKey",
	]);

export const deriveKey = (passwordKey: CryptoKey, salt, keyUsage) =>
	window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 1000000, // TODO: make this 600000 as per owasp
			hash: "SHA-512",
		},
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		false,
		keyUsage
	);

export const deriveEncryptionKey = async(password: string, salt: any) => 
	deriveKey(await getPasswordKey(password), salt, ["encrypt"])

export const deriveDecryptionKey = async(password: string, salt: any) => 
	deriveKey(await getPasswordKey(password), salt, ["decrypt"])
