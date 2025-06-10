import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container relative min-h-screen flex items-center justify-center lg:grid lg:grid-cols-2 lg:gap-8 lg:px-0">
        {/* Left side with image */}
        <div className="relative hidden h-full flex-col items-center justify-center p-10 lg:flex overflow-hidden bg-slate-900">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/auth/Auth%20Basketball%20Galaxy%20Collage.jpg" 
              alt="Basketball Galaxy"
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-700/60 via-slate-500/30 to-slate-700/50" />
          </div>
          
          {/* Quote Box */}
          <div className="relative z-10 w-full max-w-2xl mx-auto">
            
            <blockquote className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50 shadow-2xl">
              <div className="absolute -top-2 -left-2 text-5xl text-blue-400/15 font-serif">"</div>
              <p className="relative z-10 text-slate-100 text-2xl md:text-3xl leading-tight font-semibold tracking-wide">
                <div className="font-normal">{"Millionaires don't use astrology,"}</div>
                <div className="mt-2 font-semibold">
                  <span className="text-2xl md:text-3xl">B</span>
                  {"illionaires do."}
                </div>
              </p>
              <div className="mt-4 text-right text-sm text-slate-400 font-medium">
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
            className="absolute left-4 top-4 md:left-8 md:top-8 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg transition-all duration-200"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px] pt-16 pb-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              {children}
            </div>

            <div className="px-8 text-center text-sm text-slate-200">
              {footerText}{' '}
              <Link to={footerLink} className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
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
