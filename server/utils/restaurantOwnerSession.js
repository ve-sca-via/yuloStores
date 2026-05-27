import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionDirectory = path.join(__dirname, '..', '.session');
const sessionFilePath = path.join(sessionDirectory, 'restaurant-owner.json');

async function saveLoggedInOwnerId(ownerId) {
  await mkdir(sessionDirectory, { recursive: true });
  await writeFile(
    sessionFilePath,
    JSON.stringify(
      {
        ownerId,
      },
      null,
      2,
    ),
    'utf-8',
  );
}

async function getLoggedInOwnerId() {
  try {
    const content = await readFile(sessionFilePath, 'utf-8');
    const sessionData = JSON.parse(content);

    return sessionData.ownerId ?? null;
  } catch (error) {
    return null;
  }
}

export { getLoggedInOwnerId, saveLoggedInOwnerId };
