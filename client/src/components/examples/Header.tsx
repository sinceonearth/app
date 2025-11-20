import { Header as HeaderComponent } from "../Header";
import { ThemeProvider } from "../ThemeProvider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <HeaderComponent />
    </ThemeProvider>
  );
}
