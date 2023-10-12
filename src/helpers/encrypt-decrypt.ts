import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY;
const iv = process.env.IV_KEY;

// export const encryptFieldData = (data: any) => {
//   const cipher = crypto.createCipher(algorithm, 'Hello');
//   let encrypted = cipher.update(data, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return encrypted;
// };

// export const decryptFieldData = (data: any) => {
//   const decipher = crypto.createDecipher(algorithm, key);
//   let decrypted = decipher.update(data, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// };

export const encrypt = (data: any) => {
  let cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
};

export const encryptObjectFields = (dataObject: any) => {
  const encryptObject = {};
  for (let field in dataObject) {
    encryptObject[field] = encrypt(dataObject[field]);
  }
  return encryptObject;
};

export const decrypt = (data: any) => {
  let decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  let decrypted = decipher.update(Buffer.from(data, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const decryptObjectFields = (
  dataObject: any,
  includeFields: string[],
) => {
  for (let field in dataObject) {
    if (includeFields.includes(field)) {
      if (
        typeof dataObject[field] === 'object' &&
        !Array.isArray(dataObject[field])
      ) {
        dataObject[field] = decryptObjectFields(
          dataObject[field],
          includeFields,
        );
      } else {
        dataObject[field] = decrypt(dataObject[field]);
      }
    }
  }
  return dataObject;
};

export const decryptArrayOfObject = (
  dataArray: any[],
  includeFields: string[],
) => {
  const decryptArray = [];

  dataArray.forEach((object) => {
    decryptArray.push(decryptObjectFields(object, includeFields));
  });

  return decryptArray;
};

// this will use for decrypt large data
export const decryptArrayOfObjects = async (
  dataArray: any[],
  includeFields: string[],
) => {
  const arrayLength = dataArray.length;
  const batchSize = Math.ceil(Math.sqrt(arrayLength));
  const decryptedArray = [];

  for (let i = 0; i < arrayLength; i += batchSize) {
    const batch = dataArray.slice(i, i + batchSize);
    const decryptedBatch = await Promise.all(
      batch.map((object) => decryptObjectFields(object, includeFields)),
    );
    decryptedArray.push(...decryptedBatch);
  }

  return decryptedArray;
};
