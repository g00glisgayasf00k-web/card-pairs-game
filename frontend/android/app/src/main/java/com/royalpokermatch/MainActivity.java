package com.royalpokermatch;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: WebView draws under system bars; we push real insets into CSS
        // because Android WebView often reports env(safe-area-inset-*) as 0.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            String js = String.format(
                Locale.US,
                "document.documentElement.style.setProperty('--android-safe-top','%.2fpx');"
                    + "document.documentElement.style.setProperty('--android-safe-bottom','%.2fpx');"
                    + "document.documentElement.style.setProperty('--android-safe-left','%.2fpx');"
                    + "document.documentElement.style.setProperty('--android-safe-right','%.2fpx');",
                bars.top / density,
                bars.bottom / density,
                bars.left / density,
                bars.right / density
            );
            webView.evaluateJavascript(js, null);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
