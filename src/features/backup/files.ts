import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const appVersion = (): string => Constants.expoConfig?.version ?? 'unknown';

/** Hands the text to the user: a download on the web, the share sheet on a device. */
export async function saveBackupFile(name: string, text: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // The download starts asynchronously; revoking at once can fail it in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: name, UTI: 'public.json' });
}

/** Lets the user pick a file and returns its text, or null when they cancel. */
export const pickBackupFile = (): Promise<string | null> => pickTextFile(['application/json', 'text/plain']);

export const pickCsvFile = (): Promise<string | null> =>
  pickTextFile(['text/csv', 'text/comma-separated-values', 'text/plain']);

async function pickTextFile(type: string[]): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset.file ? asset.file.text() : new File(asset.uri).text();
}
