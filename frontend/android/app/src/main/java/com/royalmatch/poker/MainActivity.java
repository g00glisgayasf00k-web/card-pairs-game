package com.royalmatch.poker;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep WebView clear of camera cutout / gesture nav (Android 15 edge-to-edge).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
