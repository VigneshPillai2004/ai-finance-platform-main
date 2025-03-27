import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, Calculator, Home } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async () => {
  try {
    await checkUser();
  } catch (error) {
    console.error('Error in Header:', error);
  }

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo.png"}
            alt="Welth Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a href="#features" className="text-muted-foreground hover:text-primary">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-muted-foreground hover:text-primary"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Button variant="outline">
                <Home size={18} />
                <span className="hidden md:inline">Home</span>
              </Button>
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link
              href="/tax"
              className="text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Button variant="outline">
                <Calculator size={18} />
                <span className="hidden md:inline">Tax</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button className="flex items-center gap-2">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </a>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
