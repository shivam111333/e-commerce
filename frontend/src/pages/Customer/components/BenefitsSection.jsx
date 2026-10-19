import { FaCheckCircle, FaShoppingBag, FaTruck } from "react-icons/fa";

const BENEFITS = [
  { icon: <FaTruck />, title: "Delivery to your door", text: "Track your order from checkout to delivery." },
  { icon: <FaCheckCircle />, title: "Easy ordering", text: "A smooth, secure checkout experience." },
  { icon: <FaShoppingBag />, title: "A little of everything", text: "Explore products across all your favorite categories." },
];

function BenefitsSection() {
  return (
    <section className="grid gap-3 border-t border-slate-200 py-6 sm:grid-cols-3">
      {BENEFITS.map((benefit) => (
        <div key={benefit.title} className="flex items-center gap-3 rounded-xl bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            {benefit.icon}
          </span>
          <div>
            <p className="text-sm font-semibold">{benefit.title}</p>
            <p className="mt-1 text-xs text-slate-500">{benefit.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default BenefitsSection;