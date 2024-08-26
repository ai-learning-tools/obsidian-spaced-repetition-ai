import { SRSettings } from "@/settings";
import { Platform } from "obsidian";

// @ts-ignore
let safeStorage: Electron.SafeStorage;

if (Platform.isDesktop) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  safeStorage = (require("electron") as any)?.remote?.safeStorage;
}

const EncryptionService = {
  ENCRYPTION_PREFIX: "enc_",
  DECRYPTION_PREFIX: "dec_",

  isPlainText(key: string): boolean {
    return (
      !key.startsWith(this.ENCRYPTION_PREFIX) && !key.startsWith(this.DECRYPTION_PREFIX)
    );
  },

  isDecrypted(keyBuffer: any): boolean {
    return (
      keyBuffer.startsWith(this.DECRYPTION_PREFIX)
    );
  },
  
  encryptAllKeys(settings: SRSettings): SRSettings {
    const keysToEncrypt = Object.keys(settings).filter((key) => key.toLowerCase().includes("apikey"));

    const encryptedSettings = { ...settings };
    for (const key of keysToEncrypt) {
      const apiKey = settings[key as keyof SRSettings] as string;
      if (apiKey.length > 0) {
        (encryptedSettings[key as keyof SRSettings] as any) = this.getEncryptedKey(apiKey);
      }
    }
    return encryptedSettings;
  },

  getEncryptedKey(apiKey: string): string {
    // Return if encryption is not enabled or already encrypted
    if (
      !safeStorage.isEncryptionAvailable() ||
      apiKey.startsWith(this.ENCRYPTION_PREFIX)      
    ) {
      return apiKey;
    }
    // Check that what is encrypted is the plain text api key. Remove prefix if key is decrypted
    if (this.isDecrypted(apiKey)) {
      apiKey = apiKey.replace(this.DECRYPTION_PREFIX, "");
    }
    const encryptedBuffer = safeStorage.encryptString(apiKey) as Buffer;
    // Convert encrypted buffer to a Base64 string and prepend the prefix
    return (
      this.ENCRYPTION_PREFIX + encryptedBuffer.toString("base64")
    );
  },

  getDecryptedKey(apiKey: string): string {
    if (!apiKey) {
      return apiKey;
    }
    if (this.isPlainText(apiKey)) {
      return apiKey;
    }
    if (this.isDecrypted(apiKey)) {
      return apiKey.replace(this.DECRYPTION_PREFIX, "");
    }

    const base64Data = apiKey.replace(this.ENCRYPTION_PREFIX, "");
    try {
      const buffer = Buffer.from(base64Data, "base64");
      return safeStorage.decryptString(buffer) as string;
    } catch (err) {
      return "SR failed to decrypt API keys!";
    }
  }
}

export default EncryptionService;