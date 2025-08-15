import hashlib
import os
import binascii

def hash_password(password):
    """
    Hash a password for storing.
    Uses PBKDF2 with a random salt.
    """
    # Generate a random salt
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    # Hash the password with the salt
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), 
                                salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    # Return the salt and hash concatenated
    return (salt + pwdhash).decode('ascii')

def verify_password(stored_password, provided_password):
    """
    Verify a stored password against one provided by user
    """
    import logging
    logger = logging.getLogger(__name__)
    
    salt = stored_password[:64]
    stored_hash = stored_password[64:]
    
    logger.info(f"Salt length: {len(salt)}")
    logger.info(f"Stored hash length: {len(stored_hash)}")
    
    pwdhash = hashlib.pbkdf2_hmac('sha512', 
                                  provided_password.encode('utf-8'), 
                                  salt.encode('ascii'), 
                                  100000)
    pwdhash = binascii.hexlify(pwdhash).decode('ascii')
    
    logger.info(f"Generated hash length: {len(pwdhash)}")
    logger.info(f"Hash match: {pwdhash == stored_hash}")
    
    return pwdhash == stored_hash