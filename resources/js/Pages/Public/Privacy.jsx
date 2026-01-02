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

export default function Privacy({ title, meta }) {
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
                            Privacy Policy
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
                                        1. Information We Collect
                                    </h2>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                                        Personal Information
                                    </h3>
                                    <ul className="text-gray-700 leading-relaxed space-y-2 mb-4">
                                        <li>
                                            • Name and contact information
                                            (email, phone number)
                                        </li>
                                        <li>
                                            • Account credentials and
                                            preferences
                                        </li>
                                        <li>
                                            • Billing and shipping addresses
                                        </li>
                                        <li>
                                            • Payment information (processed
                                            securely by third-party providers)
                                        </li>
                                    </ul>

                                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                                        Automatically Collected Information
                                    </h3>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Device and browser information
                                        </li>
                                        <li>• IP address and location data</li>
                                        <li>
                                            • Website usage patterns and
                                            preferences
                                        </li>
                                        <li>
                                            • Cookies and similar tracking
                                            technologies
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        2. How We Use Your Information
                                    </h2>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Process and fulfill your orders
                                        </li>
                                        <li>
                                            • Communicate about your purchases
                                            and account
                                        </li>
                                        <li>
                                            • Provide customer support and
                                            technical assistance
                                        </li>
                                        <li>
                                            • Send promotional offers and
                                            updates (with your consent)
                                        </li>
                                        <li>
                                            • Improve our website and services
                                        </li>
                                        <li>
                                            • Prevent fraud and ensure security
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        3. Information Sharing
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We do not sell, trade, or rent your
                                        personal information to third parties.
                                        We may share your information only in
                                        these limited circumstances:
                                    </p>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • With service providers who help us
                                            operate our business
                                        </li>
                                        <li>
                                            • When required by law or legal
                                            process
                                        </li>
                                        <li>
                                            • To protect our rights, property,
                                            or safety
                                        </li>
                                        <li>• With your explicit consent</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        4. Data Security
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We implement appropriate technical and
                                        organizational measures to protect your
                                        personal information against
                                        unauthorized access, alteration,
                                        disclosure, or destruction.
                                    </p>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • SSL encryption for data
                                            transmission
                                        </li>
                                        <li>• Secure payment processing</li>
                                        <li>• Regular security assessments</li>
                                        <li>
                                            • Limited access to personal
                                            information
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        5. Your Rights and Choices
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        You have the right to:
                                    </p>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Access and update your personal
                                            information
                                        </li>
                                        <li>
                                            • Delete your account and associated
                                            data
                                        </li>
                                        <li>
                                            • Opt-out of marketing
                                            communications
                                        </li>
                                        <li>
                                            • Request a copy of your personal
                                            data
                                        </li>
                                        <li>
                                            • Object to certain types of data
                                            processing
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        6. Cookies and Tracking
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We use cookies and similar technologies
                                        to enhance your browsing experience,
                                        analyze website traffic, and personalize
                                        content. You can manage cookie
                                        preferences through your browser
                                        settings.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        7. Data Retention
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We retain your personal information only
                                        as long as necessary to fulfill the
                                        purposes outlined in this policy, comply
                                        with legal obligations, and resolve
                                        disputes.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        8. Children's Privacy
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        Our services are not intended for
                                        children under 13 years of age. We do
                                        not knowingly collect personal
                                        information from children under 13.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                        9. Contact Us
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        If you have questions about this Privacy
                                        Policy or our data practices, please
                                        contact us:
                                    </p>
                                    <ul className="text-gray-700 leading-relaxed space-y-2">
                                        <li>
                                            • Email: privacy@jongbanstore.com
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
