import { Redirect } from "expo-router";

export default function Index() {
  console.log(process.env.BASE_URL);
  return <Redirect href="/(tabs)" />;
}
