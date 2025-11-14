from cryptography.fernet import Fernet

def encrypt_message(message, key_b64):
    f = Fernet(key_b64)
    encrypted_message = f.encrypt(message.encode())
    return encrypted_message.decode('utf-8')

def decrypt_message(encrypted_message, key_b64):
    try:
        f = Fernet(key_b64)
        decrypted_message = f.decrypt(encrypted_message.encode('utf-8'))
        return decrypted_message.decode('utf-8')
    except:
        return None