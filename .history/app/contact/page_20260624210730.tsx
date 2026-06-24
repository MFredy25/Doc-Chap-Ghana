import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Clock3,
} from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H16.8V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.7v3h2.7v8h3.1Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.5L6.3 22H3.2l7.3-8.4L2.8 2h6.4L13.6 8 18.9 2Zm-1.1 18h1.7L8.2 3.9H6.4L17.8 20Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.7 3c.3 1.8 1.3 3.2 3.3 3.4v3.1c-1.2 0-2.3-.3-3.3-.9v6.7c0 3.4-2.7 5.7-6 5.7-3.6 0-6.3-3.3-5.8-6.9.4-2.7 2.6-4.7 5.4-4.7.5 0 .9.1 1.3.2v3.2c-.4-.2-.8-.3-1.3-.3-1.4 0-2.5 1.1-2.5 2.5 0 1.7 1.6 2.9 3.2 2.4.9-.3 1.5-1.1 1.5-2.1V3h4.2Z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5A3 3 0 0 0 2.4 7.2C1.9 9.1 1.9 12 1.9 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM10 15.5V8.5l6 3.5-6 3.5Z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="mx-auto min-h-[calc(100vh-120px)] max-w-7xl bg-white px-4 py-16 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:px-8">
        <h1 className="mb-10 text-center text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Get in touch
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p className="mb-6 text-base text-gray-700 dark:text-gray-300 sm:text-lg">
              Have a question or need assistance? Our team is available Monday
              to Friday, from 8:00 AM to 6:00 PM (UTC).
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-purple-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                    <MapPin className="h-5 w-5" />
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Location
                  </h4>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Our Ghana office address will be available soon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-green-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <Mail className="h-5 w-5" />
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Email
                  </h4>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    contact@doc-chap.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-pink-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40">
                    <Phone className="h-5 w-5" />
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Phone / WhatsApp
                  </h4>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Ghana contact details will be available soon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-blue-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                    <Clock3 className="h-5 w-5" />
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Support hours
                  </h4>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Monday to Friday, 8:00 AM to 6:00 PM (UTC).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="mailto:contact@doc-chap.com?subject=Contact%20Doc%20Chap%20Ghana"
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2 text-white transition duration-200 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                <Mail className="h-5 w-5" />
                <span>Email our team</span>
              </a>

              <a
                href="/help"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-white transition duration-200 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Visit the Help Centre</span>
              </a>
            </div>

            <div className="mt-8">
              <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                Follow us
              </h4>

              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:opacity-80 dark:bg-white/5"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-600 transition hover:opacity-80 dark:bg-white/5"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-black transition hover:opacity-80 dark:bg-white/5 dark:text-gray-100"
                  aria-label="X"
                >
                  <XIcon className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-black transition hover:opacity-80 dark:bg-white/5 dark:text-gray-100"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:opacity-80 dark:bg-white/5"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Send us a message
            </h2>

            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Complete the form below and our team will get back to you within
              one business day.
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />

                <input
                  type="text"
                  placeholder="Organisation"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="tel"
                  placeholder="Phone number"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>

              <input
                type="text"
                placeholder="Subject"
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />

              <textarea
                placeholder="Your message"
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />

              <button
                type="submit"
                className="rounded-md bg-red-600 px-6 py-2 text-white transition duration-200 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Send message
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/60">
          <MapPin className="mx-auto h-8 w-8 text-teal-600" />

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ghana location coming soon
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
            Our Ghana office address and map will be added here as soon as the
            location is confirmed.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}