import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk"

const keychain = new KeychainSDK(window)

export default function HiveKeychain() {
  return keychain
}

// Broadcast operations using Hive Keychain
export async function broadcastOperations(username: string, operations: any[]) {
  const response = await keychain.broadcast({
    username,
    operations,
    method: KeychainKeyTypes.posting
  })
  
  if (response.success) {
    return response
  } else {
    throw new Error(response.message || response.error || 'Transaction failed')
  }
}
