import { memo } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { SvgXml } from "react-native-svg";
import { getBrandIconXml } from "@/lib/brandIcons";

interface SubscriptionIconProps {
  slug?: string;
  fallback: ImageSourcePropType;
  size?: number;
}

function SubscriptionIcon({
  slug,
  fallback,
  size = 64,
}: SubscriptionIconProps) {
  const xml = getBrandIconXml(slug);
  const image = (
    <Image
      source={fallback}
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
  return (
    <View
      style={{ width: size, height: size }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {xml ? (
        <SvgXml xml={xml} width={size} height={size} fallback={image} />
      ) : (
        image
      )}
    </View>
  );
}

export default memo(SubscriptionIcon);
