; Instalador oficial da MAW. Compilado por scripts/build-installer.mjs, que passa
; AppVersion, SourceExe (MAW_APP.exe de Release) e MawRepo (para LICENSE e créditos).
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceExe
  #error SourceExe precisa ser definido (/DSourceExe=...)
#endif
#ifndef MawRepo
  #error MawRepo precisa ser definido (/DMawRepo=...)
#endif

[Setup]
AppId={{DD0F02F2-3F2C-48E1-A02E-F3A0C7F76221}
AppName=MAW
AppVersion={#AppVersion}
AppVerName=MAW {#AppVersion}
AppPublisher=Wayner Pires de Moraes
AppPublisherURL=https://github.com/WaynerMoraes12/Site-oficial-MAW
DefaultDirName={autopf}\MAW
DefaultGroupName=MAW
DisableProgramGroupPage=yes
LicenseFile={#MawRepo}\LICENSE
OutputDir=output
OutputBaseFilename=MAW-Setup-{#AppVersion}
SetupIconFile=maw.ico
UninstallDisplayIcon={app}\MAW.exe
Compression=lzma2/max
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#SourceExe}"; DestDir: "{app}"; DestName: "MAW.exe"; Flags: ignoreversion
Source: "{#MawRepo}\LICENSE"; DestDir: "{app}"; DestName: "LICENSE.txt"; Flags: ignoreversion
Source: "{#MawRepo}\LICENSE-THIRD-PARTY.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "redist\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\MAW"; Filename: "{app}\MAW.exe"
Name: "{group}\{cm:UninstallProgram,MAW}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\MAW"; Filename: "{app}\MAW.exe"; Tasks: desktopicon

[Run]
; O MAW_APP.exe é /MD (MultiThreadedDLL): precisa do runtime. O instalador da Microsoft
; não faz nada se a mesma versão ou uma mais nova já estiver instalada.
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installing the Microsoft Visual C++ runtime..."; Flags: waituntilterminated
Filename: "{app}\MAW.exe"; Description: "{cm:LaunchProgram,MAW}"; Flags: nowait postinstall skipifsilent
