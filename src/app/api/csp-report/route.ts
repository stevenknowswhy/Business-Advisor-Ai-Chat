import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    
    // Log CSP violations in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 CSP Violation Report:', {
        blockedURI: report['csp-report']?.['blocked-uri'],
        violatedDirective: report['csp-report']?.['violated-directive'],
        originalPolicy: report['csp-report']?.['original-policy'],
        sourceFile: report['csp-report']?.['source-file'],
        lineNumber: report['csp-report']?.['line-number'],
        columnNumber: report['csp-report']?.['column-number'],
      });
    }
    
    // In production, you might want to send this to a logging service
    // like Sentry, LogRocket, or your own analytics
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new Response('Error', { status: 500 });
  }
}
