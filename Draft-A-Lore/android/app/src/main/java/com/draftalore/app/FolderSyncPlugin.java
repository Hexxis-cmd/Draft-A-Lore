package com.draftalore.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FolderSync")
public class FolderSyncPlugin extends Plugin {
    private static final String PREFS = "draftalore_linked_folders";
    private static final String DIRECTORY_MIME = DocumentsContract.Document.MIME_TYPE_DIR;

    @PluginMethod
    public void chooseFolder(PluginCall call) {
        String projectId = projectId(call);
        if (projectId == null) return;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION |
                Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, intent, "folderChosen");
    }

    @ActivityCallback
    private void folderChosen(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }
        String projectId = projectId(call);
        if (projectId == null) return;
        Uri uri = result.getData().getData();
        int flags = result.getData().getFlags();
        if ((flags & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) == 0) {
            call.reject("Android did not grant write access to that folder.");
            return;
        }
        try {
            if ((flags & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0) {
                getContext().getContentResolver().takePersistableUriPermission(uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } else {
                getContext().getContentResolver().takePersistableUriPermission(uri,
                        Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            }
            String name = displayName(uri);
            preferences().edit().putString(uriKey(projectId), uri.toString()).putString(nameKey(projectId), name).apply();
            JSObject value = new JSObject();
            value.put("cancelled", false);
            value.put("uri", uri.toString());
            value.put("name", name);
            call.resolve(value);
        } catch (Exception error) {
            call.reject("Draft A Lore could not keep access to that folder.", error);
        }
    }

    @PluginMethod
    public void getLinkedFolder(PluginCall call) {
        String projectId = projectId(call);
        if (projectId == null) return;
        String value = preferences().getString(uriKey(projectId), "");
        JSObject result = new JSObject();
        if (value.isEmpty()) {
            result.put("linked", false);
            call.resolve(result);
            return;
        }
        Uri uri = Uri.parse(value);
        if (!hasPersistedWritePermission(uri)) {
            preferences().edit().remove(uriKey(projectId)).remove(nameKey(projectId)).apply();
            result.put("linked", false);
            call.resolve(result);
            return;
        }
        result.put("linked", true);
        result.put("uri", value);
        result.put("name", preferences().getString(nameKey(projectId), displayName(uri)));
        call.resolve(result);
    }

    @PluginMethod
    public void unlinkFolder(PluginCall call) {
        String projectId = projectId(call);
        if (projectId == null) return;
        String value = preferences().getString(uriKey(projectId), "");
        if (!value.isEmpty()) {
            try {
                getContext().getContentResolver().releasePersistableUriPermission(
                        Uri.parse(value), Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) { }
        }
        preferences().edit().remove(uriKey(projectId)).remove(nameKey(projectId)).apply();
        call.resolve();
    }

    @PluginMethod
    public void syncTextFiles(PluginCall call) {
        String projectId = projectId(call);
        if (projectId == null) return;
        JSArray files = call.getArray("files");
        if (files == null) {
            call.reject("No files were supplied for folder sync.");
            return;
        }
        new Thread(() -> {
            try {
                int count = 0;
                for (int index = 0; index < files.length(); index++) {
                    JSONObject file = files.getJSONObject(index);
                    String path = file.optString("path", "");
                    String text = file.optString("text", "");
                    String mime = file.optString("mime", "text/plain");
                    write(projectId, path, text.getBytes(StandardCharsets.UTF_8), mime);
                    count++;
                }
                JSObject result = new JSObject();
                result.put("count", count);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not sync the linked folder: " + error.getMessage(), error);
            }
        }, "DraftALoreFolderSync").start();
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String projectId = projectId(call);
        if (projectId == null) return;
        String path = call.getString("path", "");
        String encoded = call.getString("base64", "");
        String mime = call.getString("mime", "application/octet-stream");
        new Thread(() -> {
            try {
                write(projectId, path, Base64.decode(encoded, Base64.DEFAULT), mime);
                call.resolve();
            } catch (Exception error) {
                call.reject("Could not copy “" + path + "” to the linked folder: " + error.getMessage(), error);
            }
        }, "DraftALoreAssetSync").start();
    }

    @PluginMethod
    public void readTextFile(PluginCall call) {
        readFile(call, true);
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        readFile(call, false);
    }

    private void readFile(PluginCall call, boolean asText) {
        String projectId = projectId(call);
        if (projectId == null) return;
        String path = call.getString("path", "");
        if (!isSafePath(path)) {
            call.reject("Unsafe file path.");
            return;
        }
        new Thread(() -> {
            try {
                Uri target = locate(projectId, path);
                JSObject result = new JSObject();
                if (target == null) {
                    result.put("exists", false);
                    call.resolve(result);
                    return;
                }
                try (InputStream input = getContext().getContentResolver().openInputStream(target);
                     ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    if (input == null) throw new IllegalStateException("The file could not be opened.");
                    byte[] buffer = new byte[32768];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        if (output.size() > 512 * 1024 * 1024) throw new IllegalStateException("The file exceeds the 512 MB safety limit.");
                    }
                    byte[] bytes = output.toByteArray();
                    result.put("exists", true);
                    if (asText) result.put("text", new String(bytes, StandardCharsets.UTF_8));
                    else result.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
                    call.resolve(result);
                }
            } catch (Exception error) {
                call.reject("Could not read “" + path + "”: " + error.getMessage(), error);
            }
        }, "DraftALoreFolderRead").start();
    }

    static boolean isSafePath(String path) {
        if (path == null || path.isEmpty() || path.startsWith("/") || path.startsWith("\\") || path.contains("\\")) return false;
        String[] parts = path.split("/", -1);
        for (String part : parts) {
            if (part.isEmpty() || part.equals(".") || part.equals("..") || part.indexOf('\0') >= 0) return false;
        }
        return true;
    }

    private void write(String projectId, String path, byte[] data, String mime) throws Exception {
        if (!isSafePath(path)) throw new IllegalArgumentException("Unsafe file path.");
        Uri root = linkedRoot(projectId);
        String[] parts = path.split("/");
        Uri parent = root;
        for (int index = 0; index < parts.length - 1; index++) parent = ensureDirectory(parent, parts[index]);
        String name = parts[parts.length - 1];
        Uri target = findChild(parent, name);
        ContentResolver resolver = getContext().getContentResolver();
        if (target == null) target = DocumentsContract.createDocument(resolver, parent, mime == null || mime.isEmpty() ? "application/octet-stream" : mime, name);
        if (target == null) throw new IllegalStateException("The destination file could not be created.");
        try (OutputStream output = resolver.openOutputStream(target, "wt")) {
            if (output == null) throw new IllegalStateException("The destination file could not be opened.");
            output.write(data);
            output.flush();
        }
    }

    private Uri linkedRoot(String projectId) {
        String saved = preferences().getString(uriKey(projectId), "");
        if (saved.isEmpty()) throw new IllegalStateException("Choose a folder again before syncing.");
        Uri tree = Uri.parse(saved);
        if (!hasPersistedWritePermission(tree)) throw new SecurityException("Android no longer grants access to that folder.");
        return DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
    }

    private Uri ensureDirectory(Uri parent, String name) throws Exception {
        Uri existing = findChild(parent, name);
        if (existing != null) return existing;
        Uri created = DocumentsContract.createDocument(getContext().getContentResolver(), parent, DIRECTORY_MIME, name);
        if (created == null) throw new IllegalStateException("The folder “" + name + "” could not be created.");
        return created;
    }

    private Uri findChild(Uri parent, String name) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(parent, DocumentsContract.getDocumentId(parent));
        String[] columns = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor cursor = resolver.query(children, columns, null, null, null)) {
            if (cursor == null) return null;
            while (cursor.moveToNext()) {
                if (name.equals(cursor.getString(1))) return DocumentsContract.buildDocumentUriUsingTree(parent, cursor.getString(0));
            }
        }
        return null;
    }

    private Uri locate(String projectId, String path) throws Exception {
        Uri current = linkedRoot(projectId);
        for (String part : path.split("/")) {
            current = findChild(current, part);
            if (current == null) return null;
        }
        return current;
    }

    private String displayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(uri, new String[]{ DocumentsContract.Document.COLUMN_DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null && !name.trim().isEmpty()) return name;
            }
        } catch (Exception ignored) { }
        try { return folderNameFromDocumentId(DocumentsContract.getTreeDocumentId(uri)); }
        catch (Exception ignored) { return "Android folder"; }
    }

    static String folderNameFromDocumentId(String documentId) {
        if (documentId == null || documentId.trim().isEmpty()) return "Android folder";
        int slash = documentId.lastIndexOf('/');
        int colon = documentId.lastIndexOf(':');
        int split = Math.max(slash, colon);
        String name = split >= 0 ? documentId.substring(split + 1) : documentId;
        return name.trim().isEmpty() ? "Android folder" : name;
    }

    private boolean hasPersistedWritePermission(Uri uri) {
        return getContext().getContentResolver().getPersistedUriPermissions().stream()
                .anyMatch(permission -> permission.getUri().equals(uri) && permission.isWritePermission());
    }

    private String projectId(PluginCall call) {
        String projectId = call.getString("projectId", "").trim();
        if (projectId.isEmpty()) {
            call.reject("A project is required for folder sync.");
            return null;
        }
        return projectId;
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static String uriKey(String projectId) { return "uri." + projectId; }
    private static String nameKey(String projectId) { return "name." + projectId; }
}
