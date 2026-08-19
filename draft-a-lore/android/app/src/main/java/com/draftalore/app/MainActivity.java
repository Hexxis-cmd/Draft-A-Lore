package com.draftalore.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Draft A Lore is bundled locally. Explicitly retain local asset,
        // content, DOM-storage, and database access without granting network
        // access or permitting cleartext traffic.
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
    }
}
