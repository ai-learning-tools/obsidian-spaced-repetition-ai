import { SRSettings } from "./components/SettingsPage";
import { Platform } from "obsidian";

// @ts-ignore
let safeStorage = Electron.SafeStorage;

if (Platform.isDesktop) {
  safeStorage = require("electron")?.remote?.safeStorage;
}

export default class EncryptionService {
  private settings: SRSettings;
  private static ENCRYPTION_PREFIX = "enc_";
  private static DECRYPTION_PREFIX = "dec_";

  constructor(settings: SRSettings) {
    this.settings = settings;
  }

  private isPlainText(key: string): boolean {
    return (
      !key.startsWith(EncryptionService.ENCRYPTION_PREFIX) && !key.startsWith(EncryptionService.DECRYPTION_PREFIX)
    );
  }

  private isDecrypted(keyBuffer: any): boolean {
    return (
      keyBuffer.startsWith(EncryptionService.DECRYPTION_PREFIX)
    );
  }

  public encryptAllKeys(): void {
    const keysToEncrypt = Object.keys(this.settings).filter((key) => key.toLowerCase().includes("apikey".toLowerCase()))

    for (const key of keysToEncrypt) {
      const apiKey = this.settings[key as keyof SRSettings] as string;
      (this.settings[key as keyof SRSettings] as any)  = this.getEncryptedKey(apiKey);
    }
  }

  public getEncryptedKey(apiKey: string): string {
    // Return if encryption is not enabled or already encrypted
    if (
      !safeStorage.isEncryptionAvailable() ||
      apiKey.startsWith(EncryptionService.ENCRYPTION_PREFIX)      
    ) {
      return apiKey;
    }
    // Check that what is encrypted is the plain text api key. Remove prefix if key is decrypted
    if (this.isDecrypted(apiKey)) {
      apiKey = apiKey.replace(EncryptionService.DECRYPTION_PREFIX, "");
    }
    const encryptedBuffer = safeStorage.encryptString(apiKey) as Buffer;
    // Convert encrypted buffer to a Base64 string and prepend the prefix
    return (
      EncryptionService.ENCRYPTION_PREFIX + encryptedBuffer.toString("base64")
    );
  }

  public getDecryptedKey(apiKey: string): string {
    if (this.isPlainText(apiKey)) {
      return apiKey;
    }
    if (this.isDecrypted(apiKey)) {
      return apiKey.replace(EncryptionService.DECRYPTION_PREFIX, "");
    }

    const base64Data = apiKey.replace(EncryptionService.ENCRYPTION_PREFIX, "");
    try {
      const buffer = Buffer.from(base64Data, "base64");
      return safeStorage.decryptString(buffer) as string;
    } catch (err) {
      return "SR failed to decrypt API keys!";
    }

  }
}
