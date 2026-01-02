import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export default function Terms({ title, meta }) {
    return (
        <PublicLayout>
            <Head title={title}>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
            </Head>

            <div className="bg-gray-50 min-h-screen">
                <div className="container mx-auto px-4 py-12">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h1
                            className="text-4xl font-bold text-gray-900 mb-8 text-center"
                            variants={fadeInUp}
                        >
                            Terms and Conditions
                        </motion.h1>

                        <motion.div
                            className="bg-white rounded-lg p-8 space-y-8"
                            variants={fadeInUp}
                        >
                            <div className="prose max-w-none">
                                <p className="text-gray-600 mb-6">
                                    <strong>Last updated:</strong>{" "}
                                    {new Date().toLocaleDateString()}
                                </p>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        1. Acceptance of Terms
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        By creating an account and using Jong
                                        Ban Store services, you agree to be
                                        bound by these Terms and Conditions. If
                                        you do not agree to these terms, please
                                        do not use our services.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        2. Account Registration
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        To purchase from Jong Ban Store, you
                                        must create an account with accurate and
                                        complete information. You are
                                        responsible for maintaining the
                                        confidentiality of your account
                                        credentials.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        3. Products and Services
                                    </h2>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • All mobile phones and accessories
                                            are authentic and covered by
                                            manufacturer warranty
                                        </li>
                                        <li>
                                            • Product availability and pricing
                                            are subject to change without notice
                                        </li>
                                        <li>
                                            • We reserve the right to limit
                                            quantities and refuse service
                                        </li>
                                        <li>
                                            • Product descriptions and images
                                            are for reference only
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        4. Payment and Pricing
                                    </h2>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • All prices are in USD unless
                                            otherwise specified
                                        </li>
                                        <li>
                                            • Payment must be completed before
                                            product delivery
                                        </li>
                                        <li>
                                            • We accept various payment methods
                                            including KHQR, bank transfer, and
                                            cash
                                        </li>
                                        <li>
                                            • Additional fees may apply for
                                            certain payment methods
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        5. Return and Refund Policy
                                    </h2>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Returns accepted within 7 days of
                                            purchase with original packaging
                                        </li>
                                        <li>
                                            • Products must be in original
                                            condition with all accessories
                                        </li>
                                        <li>
                                            • Refunds processed within 3-5
                                            business days after approval
                                        </li>
                                        <li>
                                            • Custom or personalized items are
                                            not eligible for return
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        6. Limitation of Liability
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        Jong Ban Store shall not be liable for
                                        any indirect, incidental, special, or
                                        consequential damages arising from your
                                        use of our services or products.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        7. Contact Information
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        If you have questions about these Terms
                                        and Conditions, please contact us:
                                    </p>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Email: support@jongbanstore.com
                                        </li>
                                        <li>• Phone: +855-123-4567</li>
                                        <li>• Address: Phnom Penh, Cambodia</li>
                                    </ul>
                                </section>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </PublicLayout>
    );
}
