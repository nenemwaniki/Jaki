package arthur.demo.com;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Remove Arthur's own task from the recents list
            // so long-pressing the square button shows a clean screen
            ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                for (ActivityManager.AppTask task : am.getAppTasks()) {
                    task.setExcludeFromRecents(true);
                }
            }
        }
    }

}
