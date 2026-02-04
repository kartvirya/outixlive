import {
  NotificationImageUpload,
  sendEventAlert,
  sendPromoterAlert,
} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
  Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { NotificationIconPicker } from "./notification-icon-picker";
import { Button } from "./ui/button";
import { ModalComponent } from "./ui/modal";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterName?: string;
  eventName?: string;
  eventId?: string;
  promoterId?: string;
}

export const CreateNotificationModal = ({
  isOpen,
  onClose,
  promoterName,
  eventName,
  eventId,
  promoterId,
}: CreateNotificationModalProps) => {
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [notificationIcon, setNotificationIcon] = useState("1");
  const [notificationImage, setNotificationImage] =
    useState<NotificationImageUpload | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload an image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const name =
      asset.fileName || uri.split("/").pop() || `alert-${Date.now()}.jpg`;
    const type = asset.mimeType || "image/jpeg";

    setNotificationImage({ uri, name, type });
  };

  const handleRemoveImage = () => {
    setNotificationImage(null);
  };

  const handleSubmit = async () => {
    if (!message.trim() || !notificationType.trim()) {
      return;
    }

    setIsSending(true);
    try {
      if (eventId && promoterId) {
        // Send event alert
        await sendEventAlert(
          promoterId,
          eventId,
          notificationType.trim(),
          message.trim(),
          notificationIcon,
          notificationImage,
        );
      } else if (promoterId) {
        // Send promoter alert
        await sendPromoterAlert(
          promoterId,
          notificationType.trim(),
          message.trim(),
          notificationIcon,
          notificationImage,
        );
      } else {
        throw new Error("Missing event or promoter ID");
      }

      Alert.alert("Success", "Notification sent successfully");
      setMessage("");
      setNotificationType("");
      setNotificationIcon("1");
      setNotificationImage(null);
      onClose();
    } catch (error) {
      console.error("Failed to send notification:", error);
      Alert.alert("Error", "Failed to send notification. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const targetName = eventName || promoterName || "Target";
  const isEvent = !!eventName;

  return (
    <ModalComponent
      visible={isOpen}
      onClose={onClose}
      title="Create Notification"
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View>
            <Text style={styles.label}>From: {targetName}</Text>
            <Text style={styles.inputLabel}>Notification Type</Text>
            <TextInput
              style={styles.input}
              value={notificationType}
              onChangeText={setNotificationType}
              placeholder="e.g., Class Call, Urgent, Schedule"
              placeholderTextColor="#737373"
            />
            <TextInput
              style={styles.textarea}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your notification message..."
              placeholderTextColor="#737373"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.inputLabel}>Notification Image (optional)</Text>
            <Button
              variant="outline"
              onPress={handlePickImage}
              style={styles.imageButton}
            >
              {notificationImage ? "Change Image" : "Upload Image"}
            </Button>
            {notificationImage ? (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: notificationImage.uri }}
                  style={styles.previewImage}
                />
                <View style={styles.imageActions}>
                  <Text style={styles.imageName} numberOfLines={1}>
                    {notificationImage.name}
                  </Text>
                  <Button
                    variant="ghost"
                    onPress={handleRemoveImage}
                    style={styles.removeImageButton}
                  >
                    Remove
                  </Button>
                </View>
              </View>
            ) : null}
          </View>

          <NotificationIconPicker
            selectedIcon={notificationIcon}
            onSelectIcon={setNotificationIcon}
            accentColor="#22c55e"
          />

          <Text style={styles.hint}>
            {isEvent
              ? "This notification will be sent to all subscribers of this event."
              : "This notification will be sent to all subscribers of this promoter."}
          </Text>

          <View style={styles.buttons}>
            <Button variant="ghost" onPress={onClose} style={styles.button}>
              Cancel
            </Button>
            <Button
              variant="default"
              onPress={handleSubmit}
              disabled={
                !message.trim() || !notificationType.trim() || isSending
              }
              style={styles.button}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                "Send Notification"
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: "80%",
  },
  content: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 44,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },
  textarea: {
    height: 100,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingTop: 12,
    color: "#fff",
    fontSize: 16,
  },
  imageSection: {
    gap: 8,
  },
  imageButton: {
    alignSelf: "flex-start",
  },
  imagePreview: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 160,
  },
  imageActions: {
    padding: 12,
    gap: 8,
  },
  imageName: {
    color: "#d1d5db",
    fontSize: 12,
  },
  removeImageButton: {
    alignSelf: "flex-start",
  },
  hint: {
    fontSize: 12,
    color: "#737373",
  },
  buttons: {
    flexDirection: "row",
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
