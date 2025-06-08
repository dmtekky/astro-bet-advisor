import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
  showHeader?: boolean;
}

const AuthLayout = ({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
  footerLinkText,
  showHeader = true,
}: AuthLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side with image */}
        <div className="relative hidden h-full flex-col items-center justify-center p-10 lg:flex overflow-hidden bg-background">
          {/* Background Image with Light Overlay */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="relative h-full w-full">
              <img 
                src="/images/auth/Auth%20Basketball%20Galaxy%20Collage.jpg" 
                alt="Basketball Galaxy"
                className="h-full w-auto max-w-none object-contain"
              />
              <div className="absolute inset-0 bg-white/16" />
            </div>
          </div>
          
          {/* Quote Box */}
          <div className="relative z-10 w-full max-w-2xl mx-auto mt-auto">
            <blockquote className="bg-background p-8 rounded-lg border border-border shadow-lg">
              <div className="absolute -top-2 -left-2 text-5xl text-muted-foreground/30 font-serif">"</div>
              <p className="relative z-10 italic text-foreground text-xl leading-relaxed">
                Millionaires don't use Astrology, billionaires do.
              </p>
              <div className="mt-4 text-right text-sm text-muted-foreground font-medium">
                <span className="border-t border-border pt-2 inline-block">— J.P. Morgan</span>
              </div>
              <div className="absolute -bottom-2 -right-2 text-5xl text-muted-foreground/30 font-serif transform rotate-180">"</div>
            </blockquote>
          </div>
        </div>

        {/* Right side with form */}
        <div className="lg:p-8 relative">
          <Button
            variant="ghost"
            className="absolute left-4 top-4 md:left-8 md:top-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] py-8">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              {children}
            </div>

            <div className="px-8 text-center text-sm text-muted-foreground">
              {footerText}{' '}
              <Link to={footerLink} className="font-medium text-primary hover:underline">
                {footerLinkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
