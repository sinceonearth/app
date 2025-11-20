import { ThemeProvider as ThemeProviderComponent } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import { useTheme } from "../ThemeProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-foreground">Current theme: {theme}</p>
      <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </Button>
    </div>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProviderComponent>
      <ThemeToggle />
    </ThemeProviderComponent>
  );
}
