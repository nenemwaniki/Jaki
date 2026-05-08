package arthur.demo.com;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.MediaStore;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppBridge")
public class AppBridgePlugin extends Plugin {

    @PluginMethod
    public void launchApp(PluginCall call) {
        String pkg = call.getString("package");
        if (pkg == null) { call.reject("Missing package name"); return; }
        PackageManager pm = getContext().getPackageManager();
        Intent intent = pm.getLaunchIntentForPackage(pkg);
        if (intent == null) {
            // App not installed — open Play Store listing
            try {
                Intent store = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("market://details?id=" + pkg));
                store.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(store);
            } catch (Exception e) {
                Intent web = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + pkg));
                web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(web);
            }
            call.resolve();
            return;
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void launchCamera(PluginCall call) {
        // Use the standard capture intent — works on all manufacturers
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
        PackageManager pm = getContext().getPackageManager();
        if (intent.resolveActivity(pm) != null) {
            getContext().startActivity(intent);
            call.resolve();
        } else {
            call.reject("No camera app found");
        }
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null) { call.reject("Missing url"); return; }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openHomeLauncher(PluginCall call) {
        Intent intent = new Intent(android.provider.Settings.ACTION_HOME_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
