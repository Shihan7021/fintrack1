import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; // Import the generated Firebase options
import 'dart:ui';
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart'; // Import Firebase Auth
import 'dashboard.dart' show DashboardScreen; // Import your Dashboard screen

// Main entry point of the application
void main() async {
  // Ensure Flutter binding is initialized before using Firebase
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  // IMPORTANT: You must have a firebase_options.dart file from the FlutterFire CLI
  // and an await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform) call here
  // For simplicity in this file, we assume it's handled in your actual main function.
  runApp(const MyApp());
}
// Initialize Firebase

// Root widget of the application
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MindPay Online',
      theme: ThemeData(
        brightness: Brightness.dark,
        textTheme: GoogleFonts.robotoTextTheme(ThemeData.dark().textTheme),
      ),
      // Check the auth state to decide which page to show initially
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
                body: Center(child: CircularProgressIndicator()));
          }
          if (snapshot.hasData) {
            return const DashboardScreen(); // User is logged in
          }
          return const LoginPage(); // User is not logged in
        },
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}

// Main login page widget
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Stack(
        children: [
          FuturisticBackground(),
          Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(20.0),
              child: LoginCard(), // Changed to a stateful widget
            ),
          ),
        ],
      ),
    );
  }
}

// The main futuristic login card, now a StatefulWidget to manage state
class LoginCard extends StatefulWidget {
  const LoginCard({super.key});

  @override
  State<LoginCard> createState() => _LoginCardState();
}

class _LoginCardState extends State<LoginCard> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Handles the sign-in logic with Firebase
  Future<void> _signIn() async {
    if (_isLoading) return; // Prevent multiple clicks
    setState(() {
      _isLoading = true;
    });

    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      // Validate input before calling Firebase
      if (email.isEmpty || password.isEmpty) {
        throw FirebaseAuthException(
            code: 'missing-credentials',
            message: 'Please enter both email and password.');
      }

      // Sign in with Firebase Auth
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Navigate to Dashboard on success
      // The StreamBuilder in MyApp will handle the navigation automatically,
      // but an explicit pushReplacement is faster for the user experience.
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } on FirebaseAuthException catch (e) {
      // Handle specific Firebase errors
      String message;
      switch (e.code) {
        case 'user-not-found':
        case 'wrong-password':
        case 'invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'too-many-requests':
          message = 'Too many failed login attempts. Please try again later.';
          break;
        case 'missing-credentials':
          message = e.message!;
          break;
        default:
          message = 'An unexpected error occurred. Please try again.';
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      // Ensure the loading state is always reset
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 450),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20.0),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20.0, sigmaY: 20.0),
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(20.0),
                  border: Border.all(
                    color: const Color(0xFF7454AC).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const LogoAndTitle(),
                    const SizedBox(height: 24),
                    Text(
                      'Login',
                      style: GoogleFonts.raleway(
                        fontSize: 24,
                        fontWeight: FontWeight.w400,
                        color: Colors.white,
                        letterSpacing: 3,
                        shadows: [
                          const Shadow(
                              blurRadius: 10.0, color: Color(0xFF7454AC)),
                          const Shadow(
                              blurRadius: 20.0, color: Color(0xFF7454AC)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 60,
                      height: 2,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Color(0xFF7454AC),
                            Colors.transparent
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    FuturisticTextField(
                      controller: _emailController,
                      label: 'Email Address',
                      hint: 'Enter your email',
                      isEmail: true,
                    ),
                    const SizedBox(height: 24),
                    FuturisticTextField(
                      controller: _passwordController,
                      label: 'Password',
                      hint: 'Enter your password',
                      isPassword: true,
                    ),
                    const SizedBox(height: 32),
                    // Login Button now uses the _isLoading state
                    FuturisticButton(
                      text: 'Login',
                      onPressed: _signIn,
                      isLoading: _isLoading, // Pass loading state to button
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                            child: FuturisticButton(
                                text: 'Home',
                                isSecondary: true,
                                onPressed: () {})),
                        const SizedBox(width: 16),
                        Expanded(
                            child: FuturisticButton(
                                text: 'Reset',
                                isSecondary: true,
                                onPressed: () {})),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Positioned(top: 0, left: 0, child: _buildCornerAccent(isTopLeft: true)),
        Positioned(
            bottom: 0, right: 0, child: _buildCornerAccent(isTopLeft: false)),
        const ScanLine(),
      ],
    );
  }

  Widget _buildCornerAccent({required bool isTopLeft}) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        border: Border(
          top: isTopLeft
              ? const BorderSide(color: Color(0xFF7454AC), width: 2)
              : BorderSide.none,
          left: isTopLeft
              ? const BorderSide(color: Color(0xFF7454AC), width: 2)
              : BorderSide.none,
          bottom: !isTopLeft
              ? const BorderSide(color: Color(0xFF7454AC), width: 2)
              : BorderSide.none,
          right: !isTopLeft
              ? const BorderSide(color: Color(0xFF7454AC), width: 2)
              : BorderSide.none,
        ),
        borderRadius: isTopLeft
            ? const BorderRadius.only(topLeft: Radius.circular(20))
            : const BorderRadius.only(bottomRight: Radius.circular(20)),
      ),
    );
  }
}

// --- UNCHANGED WIDGETS BELOW ---
// (You can copy from here downwards if you only want to update the LoginCard)

class LogoAndTitle extends StatelessWidget {
  const LogoAndTitle({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0, end: 1),
          duration: const Duration(seconds: 3),
          builder: (context, value, child) {
            return Transform.translate(
              offset: Offset(0, sin(value * 2 * pi) * 5),
              child: child,
            );
          },
          child: const Icon(
            Icons.shield_moon,
            size: 80,
            color: Colors.white,
            shadows: [Shadow(blurRadius: 20.0, color: Color(0xFF7454AC))],
          ),
        ),
        const SizedBox(height: 16),
        const HolographicText(text: 'MindPay'),
      ],
    );
  }
}

class HolographicText extends StatefulWidget {
  final String text;
  const HolographicText({super.key, required this.text});
  @override
  State<HolographicText> createState() => _HolographicTextState();
}

class _HolographicTextState extends State<HolographicText>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 3))
          ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              colors: [Color(0xFF7454AC), Color(0xFF3C0775), Color(0xFF7454AC)],
              stops: [0.0, 0.5, 1.0],
              transform: GradientRotation(_controller.value * 2 * pi),
            ).createShader(bounds);
          },
          child: Text(
            widget.text,
            style: GoogleFonts.raleway(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 2),
          ),
        );
      },
    );
  }
}

class FuturisticTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final bool isPassword;
  final bool isEmail;
  const FuturisticTextField(
      {super.key,
      required this.controller,
      required this.label,
      required this.hint,
      this.isPassword = false,
      this.isEmail = false});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.raleway(
                fontSize: 14,
                color: const Color(0xFF7454AC),
                letterSpacing: 1)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          keyboardType:
              isEmail ? TextInputType.emailAddress : TextInputType.text,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: BorderSide(
                    color: const Color(0xFF7454AC).withOpacity(0.3))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: BorderSide(
                    color: const Color(0xFF7454AC).withOpacity(0.3))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: const BorderSide(color: Color(0xFF7454AC))),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 16.0, horizontal: 24.0),
          ),
        ),
      ],
    );
  }
}

class FuturisticButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isSecondary;
  final bool isLoading; // Added to show a loading indicator
  const FuturisticButton(
      {super.key,
      required this.text,
      required this.onPressed,
      this.isSecondary = false,
      this.isLoading = false});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12.0),
        gradient: isSecondary
            ? null
            : const LinearGradient(
                colors: [Color(0xFF3C0775), Color(0xFF7454AC)]),
        boxShadow: isSecondary
            ? []
            : [
                BoxShadow(
                    color: const Color(0xFF3C0775).withOpacity(0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 5))
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed, // Disable button when loading
          borderRadius: BorderRadius.circular(12.0),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSecondary
                  ? Colors.white.withOpacity(0.1)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(12.0),
              border: isSecondary
                  ? Border.all(color: const Color(0xFF7454AC).withOpacity(0.5))
                  : null,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : Text(
                    text,
                    style: GoogleFonts.raleway(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isSecondary
                            ? const Color(0xFF7454AC)
                            : Colors.white,
                        letterSpacing: 2),
                  ),
          ),
        ),
      ),
    );
  }
}

class ScanLine extends StatefulWidget {
  const ScanLine({super.key});
  @override
  State<ScanLine> createState() => _ScanLineState();
}

class _ScanLineState extends State<ScanLine>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(duration: const Duration(seconds: 3), vsync: this)
          ..repeat();
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return LayoutBuilder(builder: (context, constraints) {
          final cardHeight = constraints.maxHeight;
          return Positioned(
            top: _animation.value * cardHeight,
            left: 0,
            right: 0,
            child: Opacity(
              opacity: sin(_animation.value * pi),
              child: Container(
                height: 2,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [
                    Colors.transparent,
                    Color(0xFF7454AC),
                    Colors.transparent
                  ]),
                ),
              ),
            ),
          );
        });
      },
    );
  }
}

class FuturisticBackground extends StatefulWidget {
  const FuturisticBackground({super.key});
  @override
  State<FuturisticBackground> createState() => _FuturisticBackgroundState();
}

class _FuturisticBackgroundState extends State<FuturisticBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Particle> particles = [];
  final Random random = Random();
  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(duration: const Duration(seconds: 6), vsync: this)
          ..repeat();
    for (int i = 0; i < 9; i++) {
      particles.add(Particle(random));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color(0xFF0a0a0a),
                Color(0xFF1a1a2e),
                Color(0xFF16213e),
                Color(0xFF3C0775),
                Color(0xFF7454AC)
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              stops: [0.0, 0.25, 0.5, 0.75, 1.0],
            ),
          ),
        ),
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return CustomPaint(
                painter: ParticlePainter(_controller.value, particles),
                child: Container());
          },
        ),
      ],
    );
  }
}

class Particle {
  final Random random;
  late double x, size, initialY;
  late Duration animationDelay;
  Particle(this.random) {
    x = random.nextDouble();
    size = random.nextDouble() * 4 + 3;
    animationDelay = Duration(milliseconds: random.nextInt(6000));
    initialY = 1.1 + random.nextDouble() * 0.2;
  }
}

class ParticlePainter extends CustomPainter {
  final double animationValue;
  final List<Particle> particles;
  ParticlePainter(this.animationValue, this.particles);
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF7454AC).withOpacity(0.3);
    for (var particle in particles) {
      double progress =
          (animationValue + particle.animationDelay.inMilliseconds / 6000.0) %
              1.0;
      double opacity = 0;
      if (progress > 0.1 && progress < 0.9) {
        opacity = 1.0;
      } else if (progress <= 0.1) {
        opacity = progress / 0.1;
      } else {
        opacity = (1.0 - progress) / 0.1;
      }
      paint.color = const Color(0xFF7454AC).withOpacity(0.3 * opacity);
      final xPos = particle.x * size.width;
      final yPos = size.height * (particle.initialY - progress * 1.5);
      canvas.drawCircle(Offset(xPos, yPos), particle.size, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
