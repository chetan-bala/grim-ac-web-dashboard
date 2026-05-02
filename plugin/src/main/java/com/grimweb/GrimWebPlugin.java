package com.grimweb;

import ac.grim.grimac.api.event.EventBus;
import ac.grim.grimac.api.event.FlagEvent;
import ac.grim.grimac.api.plugin.GrimPlugin;
import ac.grim.grimac.utils.lists.HelperList;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class GrimWebPlugin extends JavaPlugin implements GrimPlugin {
    private static GrimWebPlugin instance;
    private String backendUrl = "https://your-backend.onrender.com";
    private Map<UUID, RecordingSession> activeRecordings = new ConcurrentHashMap<>();
    private EventBus eventBus;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();
        backendUrl = getConfig().getString("backend-url", backendUrl);
        
        if (Bukkit.getPluginManager().isPluginEnabled("GrimAC")) {
            RegisteredServiceProvider<GrimAbstractAPI> provider = Bukkit.getServicesManager().getRegistration(GrimAbstractAPI.class);
            if (provider != null) {
                GrimAbstractAPI api = provider.getProvider();
                eventBus = api.getEventBus();
                eventBus.subscribe(this, FlagEvent.class, this::handleFlagEvent);
                getLogger().info("Linked to GrimAC API successfully!");
            }
        } else {
            getLogger().warning("GrimAC not found! Plugin will not function.");
        }
    }

    private void handleFlagEvent(FlagEvent event) {
        Player player = event.getPlayer();
        if (player == null) return;
        
        UUID uuid = player.getUniqueId();
        if (activeRecordings.containsKey(uuid)) return;
        
        String checkName = event.getCheck().getCheckName();
        String verbose = event.getVerbose();
        
        startRecording(player, checkName, verbose);
    }

    private void startRecording(Player player, String checkName, String verbose) {
        UUID uuid = player.getUniqueId();
        RecordingSession session = new RecordingSession(player, checkName, verbose);
        activeRecordings.put(uuid, session);
        
        session.task = Bukkit.getScheduler().runTaskTimer(this, () -> {
            if (!session.isComplete()) {
                Location loc = player.getLocation();
                long timestamp = System.currentTimeMillis();
                double x = loc.getX();
                double y = loc.getY();
                double z = loc.getZ();
                float yaw = loc.getYaw();
                float pitch = loc.getPitch();
                session.addEntry(timestamp, x, y, z, yaw, pitch);
            } else {
                session.task.cancel();
                activeRecordings.remove(uuid);
                sendRecordingToBackend(session);
            }
        }, 0L, 1L);
    }

    private void sendRecordingToBackend(RecordingSession session) {
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL(backendUrl + "/api/recordings");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                JSONObject payload = new JSONObject();
                payload.put("playerUuid", session.playerUuid.toString());
                payload.put("playerName", session.playerName);
                payload.put("checkName", session.checkName);
                payload.put("verbose", session.verbose);
                payload.put("timestamp", session.startTime);
                payload.put("duration", 30);
                payload.put("recordingData", session.getRecordingData());
                
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes());
                }
                
                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    getLogger().info("Sent recording for " + session.playerName + " to backend");
                } else {
                    getLogger().warning("Failed to send recording: HTTP " + responseCode);
                }
            } catch (Exception e) {
                getLogger().severe("Error sending recording: " + e.getMessage());
            }
        });
    }

    @Override
    public void onDisable() {
        activeRecordings.values().forEach(session -> session.task.cancel());
        activeRecordings.clear();
    }

    public static GrimWebPlugin getInstance() {
        return instance;
    }

    private static class RecordingSession {
        UUID playerUuid;
        String playerName;
        String checkName;
        String verbose;
        long startTime;
        List<RecordingEntry> entries = new ArrayList<>();
        BukkitTask task;
        int maxTicks = 600;
        int currentTick = 0;

        RecordingSession(Player player, String checkName, String verbose) {
            this.playerUuid = player.getUniqueId();
            this.playerName = player.getName();
            this.checkName = checkName;
            this.verbose = verbose;
            this.startTime = System.currentTimeMillis();
        }

        void addEntry(long timestamp, double x, double y, double z, float yaw, float pitch) {
            entries.add(new RecordingEntry(timestamp, x, y, z, yaw, pitch));
            currentTick++;
        }

        boolean isComplete() {
            return currentTick >= maxTicks;
        }

        JSONArray getRecordingData() {
            JSONArray array = new JSONArray();
            for (RecordingEntry entry : entries) {
                JSONObject obj = new JSONObject();
                obj.put("t", entry.timestamp);
                obj.put("x", entry.x);
                obj.put("y", entry.y);
                obj.put("z", entry.z);
                obj.put("yw", entry.yaw);
                obj.put("pt", entry.pitch);
                array.put(obj);
            }
            return array;
        }
    }

    private static class RecordingEntry {
        long timestamp;
        double x, y, z;
        float yaw, pitch;

        RecordingEntry(long timestamp, double x, double y, double z, float yaw, float pitch) {
            this.timestamp = timestamp;
            this.x = x;
            this.y = y;
            this.z = z;
            this.yaw = yaw;
            this.pitch = pitch;
        }
    }
}
