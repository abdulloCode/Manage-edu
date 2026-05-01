import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getMyTeacherData, getMyTeacherGroups } from "../../api/teachers";
import { LoadingState, ErrorState } from "../../components/PageShell";

const fmt = (n) => Number(n ?? 0).toLocaleString("ru-RU");

const STATUS_STYLE = {
  active: { dot: "bg-success", text: "text-success", label: "Active" },
  inactive: { dot: "bg-warning", text: "text-warning", label: "Inactive" },
  archived: {
    dot: "bg-base-content/30",
    text: "text-base-content/40",
    label: "Archived",
  },
};

export default function ManagerDashboard() {
  const {
    data: teacher,
    loading: tLoading,
    error: tError,
  } = useFetch(getMyTeacherData);
  const { data: groupsData, loading: gLoading } = useFetch(getMyTeacherGroups);
  const navigate = useNavigate();

  const groups = Array.isArray(groupsData) ? groupsData : [];

  if (tLoading || gLoading) return <LoadingState />;
  if (tError) return <ErrorState message={tError} />;

  // /teachers/me/data returns flat fields; /auth/me nests them under balance{}
  const bal = teacher?.balance ?? teacher ?? {};
  const salary = Number(bal.expectedSalary ?? teacher?.salary ?? 0);
  const balance = Number(bal.balance ?? 0);
  const credit = Number(
    bal.credit ?? bal.actualPayments ?? teacher?.credit ?? 0,
  );
  const debit = Number(bal.debit ?? teacher?.debit ?? 0);
  const groupBreakdown = bal.groupBreakdown ?? [];

  const totalStudents = groups.reduce(
    (sum, g) => sum + (g.currentStudents ?? g.students?.length ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">
          Welcome back, {teacher?.name?.split(" ")[0] ?? "Teacher"} 👋
        </h1>
        <p className="text-sm text-base-content/50 mt-0.5">
          Here's your overview for today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="My Groups"
          value={groups.length}
          sub="assigned groups"
          icon={<GroupIcon />}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Total Students"
          value={totalStudents}
          sub="across all groups"
          icon={<StudentsIcon />}
          color="bg-info/10 text-info"
        />
        <StatCard
          label="Salary"
          value={`${fmt(salary)} UZS`}
          sub="monthly rate"
          icon={<WalletIcon />}
          color="bg-success/10 text-success"
          small
        />
        <StatCard
          label="Balance"
          value={`${balance >= 0 ? "+" : "−"}${fmt(Math.abs(balance))} UZS`}
          sub={balance >= 0 ? "credit available" : "amount owed"}
          icon={<ChartIcon />}
          color={
            balance >= 0
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }
          small
        />
      </div>

      {/* Balance breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main balance card — takes 2 cols */}
        <div className="lg:col-span-2 rounded-2xl bg-base-100 border border-base-200 shadow-sm p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
            Salary Balance
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-bold tabular-nums ${balance >= 0 ? "text-success" : "text-error"}`}
            >
              {balance >= 0 ? "+" : "−"}
              {fmt(Math.abs(balance))}
            </span>
            <span className="text-sm text-base-content/30 font-medium">
              UZS
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-base-200">
            <div>
              <p className="text-xs text-base-content/40">Expected Salary</p>
              <p className="text-base font-semibold text-base-content tabular-nums mt-0.5">
                {fmt(salary)}{" "}
                <span className="text-xs font-normal text-base-content/30">UZS</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/40">Actual Payments</p>
              <p className="text-base font-semibold text-info tabular-nums mt-0.5">
                {fmt(credit)}{" "}
                <span className="text-xs font-normal text-base-content/30">UZS</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/40">Debit</p>
              <p className="text-base font-semibold text-error tabular-nums mt-0.5">
                {fmt(debit)}{" "}
                <span className="text-xs font-normal text-base-content/30">UZS</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/40">Net Balance</p>
              <p className={`text-base font-semibold tabular-nums mt-0.5 ${balance >= 0 ? "text-success" : "text-error"}`}>
                {balance >= 0 ? "+" : "−"}{fmt(Math.abs(balance))}{" "}
                <span className="text-xs font-normal text-base-content/30">UZS</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
            Quick Actions
          </p>
          <div className="flex flex-col gap-2">
            <QuickAction
              label="View My Groups"
              sub="Manage attendance & ratings"
              onClick={() => navigate("/teacher/groups")}
              icon={<GroupIcon />}
            />
          </div>
        </div>
      </div>

      {/* Group breakdown */}
      {groupBreakdown.length > 0 && (
        <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-base-200">
            <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
              Group Breakdown
            </p>
          </div>
          <div className="divide-y divide-base-200">
            {groupBreakdown.map((g) => (
              <div
                key={g.groupId}
                className="flex items-center gap-4 px-6 py-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <GroupIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">
                    {g.groupName}
                  </p>
                  <p className="text-xs text-base-content/40">
                    {g.studentCount} student{g.studentCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-base-content tabular-nums">
                    {fmt(g.expectedSalary)}{" "}
                    <span className="text-xs font-normal text-base-content/30">UZS</span>
                  </p>
                  <p className="text-xs text-base-content/40">expected</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length > 0 && (
        <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-base-content">My Groups</p>
            <button
              onClick={() => navigate("/teacher/groups")}
              className="text-xs text-primary hover:text-primary/70 font-medium transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-base-200">
            {groups.slice(0, 5).map((g) => {
              const s = STATUS_STYLE[g.status] ?? STATUS_STYLE.active;
              const used = g.currentStudents ?? g.students?.length ?? 0;
              const max = g.maxStudents ?? g.capacity ?? 0;
              return (
                <button
                  key={g.id}
                  onClick={() => navigate(`/teacher/groups/${g.id}`)}
                  className="w-full text-left flex items-center gap-4 px-6 py-3.5 hover:bg-base-200/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GroupIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content truncate">
                      {g.name}
                    </p>
                    {g.course && (
                      <p className="text-xs text-base-content/40 truncate">
                        {g.course.title ?? g.course.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`hidden sm:flex items-center gap-1 text-xs font-medium ${s.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    {max > 0 && (
                      <span className="text-xs text-base-content/40">
                        {used}/{max}
                      </span>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 text-base-content/25"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, small }) {
  return (
    <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm p-5 flex flex-col gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-base-content/40 uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`font-bold text-base-content mt-0.5 tabular-nums ${small ? "text-lg" : "text-2xl"}`}
        >
          {value}
        </p>
        <p className="text-xs text-base-content/30 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function QuickAction({ label, sub, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-base-content">{label}</p>
        <p className="text-xs text-base-content/40">{sub}</p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-base-content/25 group-hover:text-primary/50 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function GroupIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function StudentsIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  );
}
function WalletIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
function ChartIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
