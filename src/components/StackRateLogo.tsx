import { View, Image } from "react-native";

interface Props {
  size?: number;
}

export default function StackRateLogo({ size = 72 }: Props) {
  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={require("../../assets/stackrate.png")}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
