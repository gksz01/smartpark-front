namespace SmartPark.Web.Compartilhado.Interface;

/// <summary>
/// Desenho (SVG 24x24, traço) dos ícones Lucide usados na versão React, para a interface ficar igual.
/// Gerado a partir do pacote lucide-react; a chave é o nome do componente no React.
/// </summary>
public static class Icones
{
    public static IReadOnlyDictionary<string, string> Desenhos { get; } = new Dictionary<string, string>
    {
        ["Activity"] = "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\"></path>",
        ["AlertTriangle"] = "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"></path><path d=\"M12 9v4\"></path><path d=\"M12 17h.01\"></path>",
        ["ArrowLeft"] = "<path d=\"m12 19-7-7 7-7\"></path><path d=\"M19 12H5\"></path>",
        ["ArrowRight"] = "<path d=\"M5 12h14\"></path><path d=\"m12 5 7 7-7 7\"></path>",
        ["BadgeCheck"] = "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\"></path><path d=\"m16 9-5.5 5.5L8 12\"></path>",
        ["Building2"] = "<path d=\"M10 12h4\"></path><path d=\"M10 8h4\"></path><path d=\"M14 21v-3a2 2 0 0 0-4 0v3\"></path><path d=\"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2\"></path><path d=\"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16\"></path>",
        ["CalendarDays"] = "<path d=\"M8 2v3\"></path><path d=\"M16 2v3\"></path><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"></rect><path d=\"M3 9h18\"></path><path d=\"M8 13h.01\"></path><path d=\"M12 13h.01\"></path><path d=\"M16 13h.01\"></path><path d=\"M8 17h.01\"></path><path d=\"M12 17h.01\"></path><path d=\"M16 17h.01\"></path>",
        ["Car"] = "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"></path><circle cx=\"7\" cy=\"17\" r=\"2\"></circle><path d=\"M9 17h6\"></path><circle cx=\"17\" cy=\"17\" r=\"2\"></circle>",
        ["Check"] = "<path d=\"M20 6 9 17l-5-5\"></path>",
        ["CheckCircle2"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"m16 9-5.5 5.5L8 12\"></path>",
        ["CircleDollarSign"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\"></path><path d=\"M12 18V6\"></path>",
        ["CircleParking"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M9 17V7h4a3 3 0 0 1 0 6H9\"></path>",
        ["Clock3"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M12 6v6h4\"></path>",
        ["CreditCard"] = "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\"></rect><line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\"></line>",
        ["DoorOpen"] = "<path d=\"M10 21H2\"></path><path d=\"M10 4a2 2 0 012.36-1.968l5.41.992A1.5 1.5 0 0119 4.5V21l-7.876.992A1 1 0 0110 21z\"></path><path d=\"M10.268 3H7a2 2 0 00-2 2v16\"></path><path d=\"M14 12h.01\"></path><path d=\"M22 21h-3\"></path>",
        ["Edit3"] = "<path d=\"M13 21h8\"></path><path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path>",
        ["FileCog"] = "<path d=\"M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z\"></path><path d=\"M20 8v12a2 2 0 0 1-2 2h-4.182\"></path><path d=\"m3.305 19.53.923-.382\"></path><path d=\"M4 10.592V4a2 2 0 0 1 2-2h8\"></path><path d=\"m4.228 16.852-.924-.383\"></path><path d=\"m5.852 15.228-.383-.923\"></path><path d=\"m5.852 20.772-.383.924\"></path><path d=\"m8.148 15.228.383-.923\"></path><path d=\"m8.53 21.696-.382-.924\"></path><path d=\"m9.773 16.852.922-.383\"></path><path d=\"m9.773 19.148.922.383\"></path><circle cx=\"7\" cy=\"18\" r=\"3\"></circle>",
        ["HeartHandshake"] = "<path d=\"M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762\"></path>",
        ["HeartPulse"] = "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"></path><path d=\"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27\"></path>",
        ["Info"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M12 16v-4\"></path><path d=\"M12 8h.01\"></path>",
        ["KeyRound"] = "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\"></path><circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"></circle>",
        ["Landmark"] = "<path d=\"M10 18v-7\"></path><path d=\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\"></path><path d=\"M14 18v-7\"></path><path d=\"M18 18v-7\"></path><path d=\"M3 22h18\"></path><path d=\"M6 18v-7\"></path>",
        ["LayoutDashboard"] = "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"></rect><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"></rect><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"></rect><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"></rect>",
        ["LogIn"] = "<path d=\"m10 17 5-5-5-5\"></path><path d=\"M15 12H3\"></path><path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"></path>",
        ["LogOut"] = "<path d=\"m16 17 5-5-5-5\"></path><path d=\"M21 12H9\"></path><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path>",
        ["MapPin"] = "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"></path><circle cx=\"12\" cy=\"10\" r=\"3\"></circle>",
        ["Menu"] = "<path d=\"M4 5h16\"></path><path d=\"M4 12h16\"></path><path d=\"M4 19h16\"></path>",
        ["Navigation"] = "<polygon points=\"3 11 22 2 13 21 11 13 3 11\"></polygon>",
        ["Palette"] = "<path d=\"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z\"></path><circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\"></circle><circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\"></circle><circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\"></circle><circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"></circle>",
        ["Plus"] = "<path d=\"M5 12h14\"></path><path d=\"M12 5v14\"></path>",
        ["QrCode"] = "<rect width=\"5\" height=\"5\" x=\"3\" y=\"3\" rx=\"1\"></rect><rect width=\"5\" height=\"5\" x=\"16\" y=\"3\" rx=\"1\"></rect><rect width=\"5\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"></rect><path d=\"M21 16h-3a2 2 0 0 0-2 2v3\"></path><path d=\"M21 21v.01\"></path><path d=\"M12 7v3a2 2 0 0 1-2 2H7\"></path><path d=\"M3 12h.01\"></path><path d=\"M12 3h.01\"></path><path d=\"M12 16v.01\"></path><path d=\"M16 12h1\"></path><path d=\"M21 12v.01\"></path><path d=\"M12 21v-1\"></path>",
        ["RotateCcw"] = "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"></path><path d=\"M3 3v5h5\"></path>",
        ["Search"] = "<path d=\"m21 21-4.34-4.34\"></path><circle cx=\"11\" cy=\"11\" r=\"8\"></circle>",
        ["Settings2"] = "<path d=\"M14 17H5\"></path><path d=\"M19 7h-9\"></path><circle cx=\"17\" cy=\"17\" r=\"3\"></circle><circle cx=\"7\" cy=\"7\" r=\"3\"></circle>",
        ["ShieldCheck"] = "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"></path><path d=\"m9 12 2 2 4-4\"></path>",
        ["ShoppingBag"] = "<path d=\"M16 10a4 4 0 0 1-8 0\"></path><path d=\"M3.103 6.034h17.794\"></path><path d=\"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z\"></path>",
        ["Sparkles"] = "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"></path><path d=\"M20 2v4\"></path><path d=\"M22 4h-4\"></path><circle cx=\"4\" cy=\"20\" r=\"2\"></circle>",
        ["Stethoscope"] = "<path d=\"M11 2v2\"></path><path d=\"M5 2v2\"></path><path d=\"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\"></path><path d=\"M8 15a6 6 0 0 0 12 0v-3\"></path><circle cx=\"20\" cy=\"10\" r=\"2\"></circle>",
        ["Tag"] = "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"></path><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"></circle>",
        ["TicketCheck"] = "<path d=\"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z\"></path><path d=\"m9 12 2 2 4-4\"></path>",
        ["Trash2"] = "<path d=\"M10 11v6\"></path><path d=\"M14 11v6\"></path><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path><path d=\"M3 6h18\"></path><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>",
        ["UserRound"] = "<circle cx=\"12\" cy=\"8\" r=\"5\"></circle><path d=\"M20 21a8 8 0 0 0-16 0\"></path>",
        ["UserRoundCheck"] = "<path d=\"M2 21a8 8 0 0 1 13.292-6\"></path><circle cx=\"10\" cy=\"8\" r=\"5\"></circle><path d=\"m16 19 2 2 4-4\"></path>",
        ["UsersRound"] = "<path d=\"M18 21a8 8 0 0 0-16 0\"></path><circle cx=\"10\" cy=\"8\" r=\"5\"></circle><path d=\"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3\"></path>",
        ["WalletCards"] = "<path d=\"M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21\"></path><path d=\"M3 7h18\"></path><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"></rect>",
        ["X"] = "<path d=\"M18 6 6 18\"></path><path d=\"m6 6 12 12\"></path>",
        ["XCircle"] = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"m15 9-6 6\"></path><path d=\"m9 9 6 6\"></path>",
        ["Zap"] = "<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\"></path>",
    };
}
