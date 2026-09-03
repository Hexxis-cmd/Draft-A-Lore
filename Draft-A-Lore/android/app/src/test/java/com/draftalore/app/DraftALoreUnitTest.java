package com.draftalore.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.getcapacitor.BridgeActivity;
import org.junit.Test;

public class DraftALoreUnitTest {
    @Test
    public void mainActivityRemainsACapacitorBridge() throws NoSuchMethodException {
        assertTrue(BridgeActivity.class.isAssignableFrom(MainActivity.class));
        assertEquals(void.class,
                MainActivity.class.getDeclaredMethod("onCreate", android.os.Bundle.class).getReturnType());
    }

    @Test
    public void folderSyncOnlyAcceptsRelativeProjectPaths() {
        assertTrue(FolderSyncPlugin.isSafePath("project.json"));
        assertTrue(FolderSyncPlugin.isSafePath("Assets/Images/cover.png"));
        assertTrue(!FolderSyncPlugin.isSafePath("../project.json"));
        assertTrue(!FolderSyncPlugin.isSafePath("/project.json"));
        assertTrue(!FolderSyncPlugin.isSafePath("Assets\\cover.png"));
    }

    @Test
    public void folderSyncDerivesReadableTreeNames() {
        assertEquals("DraftALoreTest", FolderSyncPlugin.folderNameFromDocumentId("primary:Documents/DraftALoreTest"));
        assertEquals("Documents", FolderSyncPlugin.folderNameFromDocumentId("primary:Documents"));
        assertEquals("Android folder", FolderSyncPlugin.folderNameFromDocumentId(""));
    }
}
