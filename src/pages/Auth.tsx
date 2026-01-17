import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthSettings } from "@/hooks/useAuthSettings";
import { Loader2, Mail, Phone, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/password-input";

const emailLoginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

const emailSignupSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  fullName: z.string().min(2, "Введите ваше имя"),
});

const phoneSchema = z.object({
  phone: z.string().min(10, "Введите корректный номер телефона").max(15),
});

const phoneSignupSchema = z.object({
  phone: z.string().min(10, "Введите корректный номер телефона").max(15),
  fullName: z.string().min(2, "Введите ваше имя"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Введите корректный email"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string().min(6, "Подтвердите пароль"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type EmailLoginFormData = z.infer<typeof emailLoginSchema>;
type EmailSignupFormData = z.infer<typeof emailSignupSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;
type PhoneSignupFormData = z.infer<typeof phoneSignupSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

const RESEND_COOLDOWN = 60; // seconds

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: authSettings, isLoading: authSettingsLoading } = useAuthSettings();

  // Set default auth method based on enabled methods
  useEffect(() => {
    if (!authSettingsLoading) {
      if (authSettings.auth_email_enabled) {
        setAuthMethod("email");
      } else if (authSettings.auth_phone_enabled) {
        setAuthMethod("phone");
      }
    }
  }, [authSettings, authSettingsLoading]);

  const emailLoginForm = useForm<EmailLoginFormData>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailSignupForm = useForm<EmailSignupFormData>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const phoneLoginForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const phoneSignupForm = useForm<PhoneSignupFormData>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: { phone: "", fullName: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Countdown timer for SMS resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Check for password recovery event
  useEffect(() => {
    // Check URL hash for recovery token on mount
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setShowNewPassword(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && !showNewPassword) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !showNewPassword) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const startResendCooldown = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN);
  }, []);

  const handleEmailLogin = async (data: EmailLoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка входа",
          description: error.message.includes("Invalid login credentials")
            ? "Неверный email или пароль"
            : error.message,
        });
        return;
      }

      toast({ title: "Успешный вход", description: "Добро пожаловать!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (data: EmailSignupFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: data.fullName },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка регистрации",
          description: error.message.includes("already registered")
            ? "Пользователь с таким email уже зарегистрирован"
            : error.message,
        });
        return;
      }

      toast({
        title: "Проверьте почту",
        description: "Мы отправили письмо для подтверждения регистрации",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Проверьте почту",
        description: "Мы отправили письмо со ссылкой для сброса пароля",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (data: NewPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Пароль изменён",
        description: "Вы можете войти с новым паролем",
      });
      
      setShowNewPassword(false);
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      const formattedPhone = data.phone.startsWith("+") ? data.phone : `+7${data.phone.replace(/\D/g, "")}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
        return;
      }

      setPhoneNumber(formattedPhone);
      setPhoneStep("otp");
      startResendCooldown();
      toast({
        title: "Код отправлен",
        description: "Введите код из SMS",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignup = async (data: PhoneSignupFormData) => {
    setIsLoading(true);
    try {
      const formattedPhone = data.phone.startsWith("+") ? data.phone : `+7${data.phone.replace(/\D/g, "")}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: { full_name: data.fullName },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
        return;
      }

      setPhoneNumber(formattedPhone);
      setPhoneStep("otp");
      startResendCooldown();
      toast({
        title: "Код отправлен",
        description: "Введите код из SMS",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message,
        });
        return;
      }

      startResendCooldown();
      toast({
        title: "Код отправлен повторно",
        description: "Проверьте SMS",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите 6-значный код",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Неверный код подтверждения",
        });
        return;
      }

      toast({ title: "Успешный вход", description: "Добро пожаловать!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New password form (after clicking reset link)
  if (showNewPassword) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-condensed">Новый пароль</CardTitle>
                <CardDescription>
                  Введите новый пароль для вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={newPasswordForm.handleSubmit(handleNewPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-medium leading-none">
                      Новый пароль
                    </label>
                    <PasswordInput
                      id="new-password"
                      placeholder="••••••"
                      {...newPasswordForm.register("password")}
                    />
                    {newPasswordForm.formState.errors.password && (
                      <p className="text-sm font-medium text-destructive">
                        {newPasswordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium leading-none">
                      Подтвердите пароль
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="••••••"
                      {...newPasswordForm.register("confirmPassword")}
                    />
                    {newPasswordForm.formState.errors.confirmPassword && (
                      <p className="text-sm font-medium text-destructive">
                        {newPasswordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить пароль
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Reset password form
  if (showResetPassword) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-condensed">Сброс пароля</CardTitle>
                <CardDescription>
                  Введите email для получения ссылки на сброс пароля
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm font-medium leading-none">
                      Email
                    </label>
                    <Input
                      id="reset-email"
                      placeholder="email@example.com"
                      type="email"
                      {...resetPasswordForm.register("email")}
                    />
                    {resetPasswordForm.formState.errors.email && (
                      <p className="text-sm font-medium text-destructive">
                        {resetPasswordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Отправить ссылку
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetPassword(false)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Вернуться к входу
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-condensed">Личный кабинет</CardTitle>
              <CardDescription>
                Войдите или зарегистрируйтесь для доступа к функциям сайта
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google OAuth */}
              {authSettings.auth_google_enabled && (
                <>
                  <Button
                    variant="outline"
                    className="w-full mb-4"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Войти через Google
                  </Button>

                  {(authSettings.auth_email_enabled || authSettings.auth_phone_enabled) && (
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          или
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Auth Method Toggle - only show if both methods are enabled */}
              {authSettings.auth_email_enabled && authSettings.auth_phone_enabled && (
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={authMethod === "email" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setAuthMethod("email");
                      setPhoneStep("phone");
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant={authMethod === "phone" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setAuthMethod("phone");
                      setPhoneStep("phone");
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Телефон
                  </Button>
                </div>
              )}

              {authSettings.auth_email_enabled && authMethod === "email" ? (
                <Tabs defaultValue="login" key="email-tabs">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Вход</TabsTrigger>
                    <TabsTrigger value="signup">Регистрация</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={emailLoginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="login-email" className="text-sm font-medium leading-none">
                          Email
                        </label>
                        <Input
                          id="login-email"
                          placeholder="email@example.com"
                          type="email"
                          {...emailLoginForm.register("email")}
                        />
                        {emailLoginForm.formState.errors.email && (
                          <p className="text-sm font-medium text-destructive">
                            {emailLoginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="login-password" className="text-sm font-medium leading-none">
                          Пароль
                        </label>
                        <PasswordInput
                          id="login-password"
                          placeholder="••••••"
                          {...emailLoginForm.register("password")}
                        />
                        {emailLoginForm.formState.errors.password && (
                          <p className="text-sm font-medium text-destructive">
                            {emailLoginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Войти
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-sm"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Забыли пароль?
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={emailSignupForm.handleSubmit(handleEmailSignup)} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="signup-name" className="text-sm font-medium leading-none">
                          Имя
                        </label>
                        <Input
                          id="signup-name"
                          placeholder="Иван Иванов"
                          {...emailSignupForm.register("fullName")}
                        />
                        {emailSignupForm.formState.errors.fullName && (
                          <p className="text-sm font-medium text-destructive">
                            {emailSignupForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-email" className="text-sm font-medium leading-none">
                          Email
                        </label>
                        <Input
                          id="signup-email"
                          placeholder="email@example.com"
                          type="email"
                          {...emailSignupForm.register("email")}
                        />
                        {emailSignupForm.formState.errors.email && (
                          <p className="text-sm font-medium text-destructive">
                            {emailSignupForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-password" className="text-sm font-medium leading-none">
                          Пароль
                        </label>
                        <PasswordInput
                          id="signup-password"
                          placeholder="••••••"
                          {...emailSignupForm.register("password")}
                        />
                        {emailSignupForm.formState.errors.password && (
                          <p className="text-sm font-medium text-destructive">
                            {emailSignupForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Зарегистрироваться
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : authSettings.auth_phone_enabled && phoneStep === "phone" ? (
                <Tabs defaultValue="login" key="phone-tabs">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Вход</TabsTrigger>
                    <TabsTrigger value="signup">Регистрация</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={phoneLoginForm.handleSubmit(handlePhoneLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="phone-login" className="text-sm font-medium leading-none">
                          Номер телефона
                        </label>
                        <Input
                          id="phone-login"
                          placeholder="+7 999 123-45-67"
                          type="tel"
                          {...phoneLoginForm.register("phone")}
                        />
                        {phoneLoginForm.formState.errors.phone && (
                          <p className="text-sm font-medium text-destructive">
                            {phoneLoginForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Получить код
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={phoneSignupForm.handleSubmit(handlePhoneSignup)} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="phone-signup-name" className="text-sm font-medium leading-none">
                          Имя
                        </label>
                        <Input
                          id="phone-signup-name"
                          placeholder="Иван Иванов"
                          {...phoneSignupForm.register("fullName")}
                        />
                        {phoneSignupForm.formState.errors.fullName && (
                          <p className="text-sm font-medium text-destructive">
                            {phoneSignupForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone-signup" className="text-sm font-medium leading-none">
                          Номер телефона
                        </label>
                        <Input
                          id="phone-signup"
                          placeholder="+7 999 123-45-67"
                          type="tel"
                          {...phoneSignupForm.register("phone")}
                        />
                        {phoneSignupForm.formState.errors.phone && (
                          <p className="text-sm font-medium text-destructive">
                            {phoneSignupForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Получить код
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : authSettings.auth_phone_enabled && phoneStep === "otp" ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Код отправлен на номер {phoneNumber}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Подтвердить
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendCode}
                    disabled={resendCountdown > 0 || isLoading}
                  >
                    {resendCountdown > 0 ? (
                      `Отправить повторно (${resendCountdown}с)`
                    ) : (
                      "Отправить код повторно"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setPhoneStep("phone");
                      setOtpCode("");
                      setResendCountdown(0);
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Изменить номер
                  </Button>
                </div>
              ) : !authSettings.auth_email_enabled && !authSettings.auth_phone_enabled && !authSettings.auth_google_enabled ? (
                <div className="text-center text-muted-foreground py-8">
                  Авторизация временно недоступна
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
