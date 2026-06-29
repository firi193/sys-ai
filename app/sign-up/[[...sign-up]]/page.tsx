import { SignUp } from "@clerk/nextjs";
import { Cpu, Share2, FileText } from "lucide-react";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex bg-base font-sans">
      <div className="hidden lg:flex w-1/2 bg-surface flex-col p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-copy-primary shrink-0">
            G
          </div>
          <span className="text-copy-primary font-semibold text-sm tracking-tight">
            Ghost AI
          </span>
        </div>

        <div className="flex flex-col justify-center flex-1 max-w-md">
          <h1 className="text-4xl font-bold text-copy-primary leading-tight mb-4">
            Design systems at the speed of thought.
          </h1>
          <p className="text-copy-secondary text-base leading-relaxed mb-10">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="space-y-7">
            <li className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-dim flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm">
                  AI Architecture Generation
                </p>
                <p className="text-copy-muted text-sm mt-1">
                  Describe your system, AI maps it to nodes and edges on a live
                  canvas.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-dim flex items-center justify-center shrink-0">
                <Share2 className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm">
                  Real-time Collaboration
                </p>
                <p className="text-copy-muted text-sm mt-1">
                  Live cursors, presence indicators, and shared node editing
                  across your team.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-dim flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm">
                  Instant Spec Generation
                </p>
                <p className="text-copy-muted text-sm mt-1">
                  Export a complete Markdown technical spec directly from the
                  canvas graph.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
        <SignUp />
      </div>
    </main>
  );
}
