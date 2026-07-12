package com.royalmatch.poker;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: WebView draws under system bars; CSS safe-area insets pad content.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
