import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { radius, spacing } from "@repo/theme";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { getAvatarFileName, getAvatarLocalUri } from "@/utils/avatar-images";

const AVATARS_PER_PAGE = 6;

type Props = {
  avatarUrls: string[];
  downloadedAvatarUrls: string[];
  downloadingAvatarUrl: string | null;
  previewRefreshKey: number;
  profileImageUri: string | null;
  onSelectAvatar: (url: string) => void;
};

function chunkAvatarUrls(avatarUrls: string[]) {
  const pages: string[][] = [];

  for (let index = 0; index < avatarUrls.length; index += AVATARS_PER_PAGE) {
    pages.push(avatarUrls.slice(index, index + AVATARS_PER_PAGE));
  }

  return pages;
}

function PageDot({
  activeColor,
  inactiveColor,
  index,
  scrollX,
  pageWidth,
}: {
  activeColor: string;
  inactiveColor: string;
  index: number;
  pageWidth: number;
  scrollX: Animated.Value;
}) {
  const inputRange = [
    (index - 1) * pageWidth,
    index * pageWidth,
    (index + 1) * pageWidth,
  ];
  const dotStyle = {
    backgroundColor: scrollX.interpolate({
      inputRange,
      outputRange: [inactiveColor, activeColor, inactiveColor],
      extrapolate: "clamp",
    }),
    opacity: scrollX.interpolate({
      inputRange,
      outputRange: [0.45, 1, 0.45],
      extrapolate: "clamp",
    }),
    width: scrollX.interpolate({
      inputRange,
      outputRange: [6, 16, 6],
      extrapolate: "clamp",
    }),
  };

  return <Animated.View style={[styles.pageDot, dotStyle]} />;
}

export function AvatarCarousel({
  avatarUrls,
  downloadedAvatarUrls,
  downloadingAvatarUrl,
  previewRefreshKey,
  profileImageUri,
  onSelectAvatar,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const themeColors = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const pageWidth = Math.max(1, containerWidth || windowWidth - spacing.lg * 2);
  const avatarTileSize = Math.max(
    78,
    Math.min((pageWidth - spacing.md * 2) / 3, 156),
  );
  const pages = chunkAvatarUrls(avatarUrls);
  const [activePage, setActivePage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  function updateActivePage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextPage = Math.round(
      event.nativeEvent.contentOffset.x / Math.max(pageWidth, 1),
    );

    setActivePage(Math.max(0, Math.min(nextPage, pages.length - 1)));
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        snapToAlignment="start"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={updateActivePage}
      >
        {pages.map((page, pageIndex) => (
          <View
            key={`avatar-page-${pageIndex}`}
            style={[styles.page, { width: pageWidth }]}
          >
            {page.map((url) => {
              const isSelected = profileImageUri?.endsWith(
                getAvatarFileName(url),
              );
              const isDownloading = downloadingAvatarUrl === url;
              const isDownloaded = downloadedAvatarUrls.includes(url);
              const imageUri = isDownloaded
                ? getAvatarLocalUri(url)
                : `${url}?refresh=${previewRefreshKey}`;

              return (
                <Pressable
                  key={url}
                  style={[
                    styles.avatarTile,
                    {
                      width: avatarTileSize,
                      height: avatarTileSize,
                      backgroundColor: themeColors.surface,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.text,
                    },
                    isSelected && styles.selectedAvatarTile,
                  ]}
                  disabled={Boolean(downloadingAvatarUrl)}
                  onPress={() => onSelectAvatar(url)}
                >
                  <Image
                    cachePolicy="none"
                    contentFit="cover"
                    source={{ uri: imageUri }}
                    style={styles.avatarImage}
                  />
                  {isDownloaded ? null : (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.avatarTint,
                        {
                          backgroundColor: themeColors.primary,
                        },
                      ]}
                    />
                  )}
                  {isSelected ? (
                    <View
                      style={[
                        styles.avatarCheck,
                        { backgroundColor: themeColors.primary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        color={themeColors.primaryText}
                        name="check"
                        size={16}
                      />
                    </View>
                  ) : null}
                  {isDownloading ? (
                    <View
                      style={[
                        styles.avatarLoading,
                        { backgroundColor: `${themeColors.background}CC` },
                      ]}
                    >
                      <ActivityIndicator color={themeColors.primary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.ScrollView>
      {pages.length > 1 ? (
        <View style={styles.pageDots}>
          {pages.map((_, index) => (
            <PageDot
              activeColor={themeColors.primary}
              key={`avatar-dot-${index}`}
              inactiveColor={themeColors.mutedText}
              index={index}
              pageWidth={pageWidth}
              scrollX={scrollX}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  avatarTile: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  selectedAvatarTile: {
    borderWidth: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  avatarCheck: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pageDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
});
