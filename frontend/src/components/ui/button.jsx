import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "ripple-button bg-primary text-primary-foreground shadow-glow hover:brightness-105",
        secondary: "ripple-button bg-secondary text-secondary-foreground shadow-lg hover:brightness-105",
        outline: "border border-border bg-background/[0.70] hover:bg-muted",
        ghost: "hover:bg-muted",
        premium:
          "ripple-button bg-[linear-gradient(135deg,#14b8a6,#f59e0b_48%,#fb7185)] text-white shadow-glow hover:brightness-105",
        destructive: "ripple-button bg-destructive text-destructive-foreground hover:brightness-105",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
