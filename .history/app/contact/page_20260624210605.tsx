import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Clock3,
} from "lucide-react";

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
                  <Facebook className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-600 transition hover:opacity-80 dark:bg-white/5"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-black transition hover:opacity-80 dark:bg-white/5 dark:text-gray-100"
                  aria-label="X"
                >
                  <Twitter className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-black transition hover:opacity-80 dark:bg-white/5 dark:text-gray-100"
                  aria-label="TikTok"
                >
                  <Music2 className="h-5 w-5" />
                </a>

                <a
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:opacity-80 dark:bg-white/5"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
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